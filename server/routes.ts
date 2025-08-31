import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analysisResultSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

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
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG and PNG images are allowed.'));
    }
  }
});

// Simulate disease analysis function
function analyzeImage(imagePath: string): any {
  // Simulate different disease scenarios based on random selection
  const diseases = [
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
    },
    {
      disease: "Bacterial Spot",
      severity: "Severe",
      severity_percent: 85,
      organic_diagnosis: "Remove and destroy infected plant material. Apply copper-based organic treatments. Avoid overhead watering and improve drainage. Use resistant varieties for future plantings.",
      chemical_diagnosis: "Apply copper hydroxide or copper sulfate treatments. Use bactericides containing streptomycin if available. Consider soil sterilization for severely affected areas."
    },
    {
      disease: "Healthy Plant",
      severity: "None",
      severity_percent: 5,
      organic_diagnosis: "Continue current care practices. Maintain proper spacing and watering schedule. Monitor regularly for early disease detection.",
      chemical_diagnosis: "No chemical treatment needed. Consider preventive treatments only if disease pressure is high in your area."
    }
  ];

  // Select random disease for simulation
  const randomIndex = Math.floor(Math.random() * diseases.length);
  return diseases[randomIndex];
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Image analysis endpoint
  app.post("/api/analyze", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Analyze the image (simulated)
      const analysisResult = analyzeImage(req.file.path);

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
