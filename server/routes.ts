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

    console.log('Sending image to webhook...');
    
    // Send POST request to the webhook with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch('https://n8n-803689514411.europe-west2.run.app/webhook-test/c96ccd04-d1e1-48b3-9c5d-552deff91c6e', {
      method: 'POST',
      body: form as any,
      headers: form.getHeaders(),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log('Webhook response status:', response.status);

    if (!response.ok) {
      throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
    }

    const responseText = await response.text();
    console.log('Raw webhook response:', responseText);
    
    if (!responseText.trim()) {
      throw new Error('Empty response from webhook');
    }

    const result = JSON.parse(responseText);
    console.log('Parsed webhook result:', result);
    
    // Parse the webhook response format: object with output field
    if (result && result.output) {
      const output = result.output;
      
      // Convert organic and chemical treatments from arrays to strings
      const organicTreatment = Array.isArray(output.OrganicTreatment) 
        ? output.OrganicTreatment.join(' ') 
        : output.OrganicTreatment || "Apply organic treatments as recommended by agricultural specialist.";
        
      const chemicalTreatment = Array.isArray(output.ChemicalTreatment)
        ? output.ChemicalTreatment.join(' ')
        : output.ChemicalTreatment || "Consult with agricultural specialist for chemical treatment options.";

      // Map severity to proper format
      const severityPercent = parseInt(output.Severity) || 50;
      let severityLevel = "Moderate";
      if (severityPercent <= 25) severityLevel = "Mild";
      else if (severityPercent <= 50) severityLevel = "Moderate";
      else severityLevel = "Severe";

      return {
        disease: output.Diagnosis || "Unknown Disease",
        severity: severityLevel,
        severity_percent: severityPercent,
        organic_diagnosis: organicTreatment,
        chemical_diagnosis: chemicalTreatment
      };
    } else {
      console.error('Invalid webhook response structure:', result);
      throw new Error('Invalid webhook response format');
    }

  } catch (error) {
    console.error('Webhook analysis error:', error);
    
    // Only use fallback if explicitly requested or after retries
    throw error; // Re-throw the error to let the calling function handle it
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Image analysis endpoint
  app.post("/api/analyze", upload.single('image'), async (req: Request, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      console.log('Starting image analysis for file:', req.file.originalname);

      let analysisResult;
      
      try {
        // Try to get analysis from webhook
        analysisResult = await analyzeImageWithWebhook(req.file);
        console.log('Successfully got webhook response');
      } catch (webhookError) {
        console.log('Webhook failed, using fallback analysis:', webhookError);
        
        // Return error if webhook fails - no fallback data
        throw new Error('Webhook analysis failed. Please try again or check your connection.');
      }

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
