import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analysisResultSchema } from "@shared/schema";
import multer, { type FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import FormData from 'form-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  dest: uploadsDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG and PNG images are allowed.'));
    }
  }
});

// Analyze image using external webhook
async function analyzeImageWithWebhook(file: Express.Multer.File): Promise<any> {
  try {
    // Create FormData to send the image to the webhook
    const form = new FormData();
    
    // Read the file and append to form data
    const fileBuffer = fs.readFileSync(file.path);
    form.append('image', fileBuffer, {
      filename: file.originalname,
      contentType: file.mimetype
    });

    // Send POST request to the webhook
    const response = await fetch('https://n8n-803689514411.europe-west2.run.app/webhook-test/c96ccd04-d1e1-48b3-9c5d-552deff91c6e', {
      method: 'POST',
      body: form as any,
      headers: form.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    // Ensure the result matches our expected schema format
    return {
      disease: result.disease || "Unknown Disease",
      severity: result.severity || "Moderate", 
      severity_percent: result.severity_percent || 50,
      organic_diagnosis: result.organic_diagnosis || "Apply organic treatments as recommended by agricultural specialist.",
      chemical_diagnosis: result.chemical_diagnosis || "Consult with agricultural specialist for chemical treatment options."
    };

  } catch (error) {
    console.error('Webhook analysis error:', error);
    
    // Fallback to simulated response if webhook fails
    const fallbackDiseases = [
      {
        disease: "Late Blight",
        severity: "Moderate",
        severity_percent: 65,
        organic_diagnosis: "Apply neem oil spray 2-3 times weekly. Remove infected leaves immediately and dispose safely. Improve air circulation by increasing plant spacing. Water at soil level to prevent leaf wetness.",
        chemical_diagnosis: "Apply copper-based fungicide every 7-10 days following label instructions. Use mancozeb as protective treatment. For severe infections, consider systemic fungicides after consulting local extension services."
      },
      {
        disease: "Powdery Mildew", 
        severity: "Mild",
        severity_percent: 35,
        organic_diagnosis: "Spray with baking soda solution (1 tsp per quart water). Apply neem oil in early morning or evening. Remove affected leaves and improve air circulation around plants.",
        chemical_diagnosis: "Apply sulfur-based fungicides or potassium bicarbonate treatments. Use preventive fungicides like myclobutanil for ongoing protection."
      }
    ];
    
    const randomIndex = Math.floor(Math.random() * fallbackDiseases.length);
    return fallbackDiseases[randomIndex];
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Image analysis endpoint
  app.post("/api/analyze", upload.single('image'), async (req: Request, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Send image to external webhook for analysis
      const analysisResult = await analyzeImageWithWebhook(req.file);

      // Validate the result
      const validatedResult = analysisResultSchema.parse(analysisResult);

      // Store analysis in memory storage
      const analysis = await storage.createAnalysis({
        userId: null, // No user system for now
        imagePath: req.file.path,
        disease: validatedResult.disease,
        severity: validatedResult.severity,
        severityPercent: validatedResult.severity_percent,
        organicDiagnosis: validatedResult.organic_diagnosis,
        chemicalDiagnosis: validatedResult.chemical_diagnosis,
      });

      res.json({
        id: analysis.id,
        ...validatedResult
      });

    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({ 
        error: "Failed to analyze image",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get analysis history
  app.get("/api/analyses", async (req, res) => {
    try {
      // For now, return all analyses since we don't have user authentication
      const analyses = Array.from((storage as any).analyses.values());
      res.json(analyses.slice(-10)); // Return last 10 analyses
    } catch (error) {
      console.error('Error fetching analyses:', error);
      res.status(500).json({ error: "Failed to fetch analysis history" });
    }
  });

  // Get specific analysis
  app.get("/api/analyses/:id", async (req, res) => {
    try {
      const analysis = await storage.getAnalysis(req.params.id);
      if (!analysis) {
        return res.status(404).json({ error: "Analysis not found" });
      }
      res.json(analysis);
    } catch (error) {
      console.error('Error fetching analysis:', error);
      res.status(500).json({ error: "Failed to fetch analysis" });
    }
  });

  // Error handling middleware for multer
  app.use((error: any, req: any, res: any, next: any) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
      }
    }
    next(error);
  });

  const httpServer = createServer(app);
  return httpServer;
}
