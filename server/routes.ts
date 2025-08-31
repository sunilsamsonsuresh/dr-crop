import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { mongoStorage } from "./mongoStorage";
import { analysisResultSchema, insertUserSchema, loginSchema } from "@shared/schema";
import multer, { type FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import { connectToDatabase } from "./db";

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
    console.log('Sending image to webhook...');
    console.log('File details:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path
    });
    
    // Read the file as binary data
    const fileBuffer = fs.readFileSync(file.path);
    console.log('File buffer size:', fileBuffer.length, 'bytes');
    
    // Send POST request to the webhook with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const webhookUrl = 'https://n8n-803689514411.europe-west2.run.app/webhook-test/c96ccd04-d1e1-48b3-9c5d-552deff91c6e';
    console.log('Sending request to webhook URL:', webhookUrl);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: fileBuffer,
      headers: {
        'Content-Type': file.mimetype,
        'Content-Length': fileBuffer.length.toString(),
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log('Webhook response status:', response.status);
    console.log('Webhook response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error response');
      console.error('Webhook error response:', errorText);
      throw new Error(`Webhook request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Raw webhook response length:', responseText.length);
    console.log('Raw webhook response:', responseText);
    
    if (!responseText.trim()) {
      throw new Error('Empty response from webhook');
    }

    let result;
    try {
      result = JSON.parse(responseText);
      console.log('Successfully parsed webhook result');
    } catch (parseError) {
      console.error('Failed to parse webhook response as JSON:', parseError);
      console.error('Response that failed to parse:', responseText);
      throw new Error('Invalid JSON response from webhook');
    }
    
    console.log('Parsed webhook result type:', typeof result);
    console.log('Parsed webhook result:', result);
    
    // Parse the webhook response format: array with output field
    if (Array.isArray(result) && result.length > 0 && result[0].output) {
      const output = result[0].output;
      console.log('Found output field:', output);
      
      // Clean and format treatment recommendations
      const cleanTreatmentText = (text: string) => {
        return text
          .replace(/\s*\(e\.g\.,?\s*/g, ' (for example: ') // Fix e.g. formatting
          .replace(/\s*\(e\.g\.\s*/g, ' (for example ') // Handle cases without comma
          .replace(/\)\s*with\s+/g, ') - ') // Clean up parentheses followed by "with"
          .trim();
      };

      // Convert organic and chemical treatments from arrays to formatted strings
      const organicTreatment = Array.isArray(output.OrganicTreatment) 
        ? output.OrganicTreatment.map(cleanTreatmentText).join('\n• ') 
        : cleanTreatmentText(output.OrganicTreatment || "Apply organic treatments as recommended by agricultural specialist.");
        
      const chemicalTreatment = Array.isArray(output.ChemicalTreatment)
        ? output.ChemicalTreatment.map(cleanTreatmentText).join('\n• ')
        : cleanTreatmentText(output.ChemicalTreatment || "Consult with agricultural specialist for chemical treatment options.");

      // Map severity to proper format - handle both numeric and text severity
      let severityPercent = 50;
      let severityLevel = "Moderate";
      
      if (typeof output.Severity === 'number') {
        severityPercent = output.Severity;
      } else if (typeof output.Severity === 'string') {
        // Parse text severity like "Mild to moderate"
        if (output.Severity.toLowerCase().includes('mild')) {
          severityPercent = 25;
          severityLevel = "Mild";
        } else if (output.Severity.toLowerCase().includes('severe')) {
          severityPercent = 75;
          severityLevel = "Severe";
        } else {
          severityPercent = 50;
          severityLevel = "Moderate";
        }
      }

      const finalResult = {
        disease: output.Diagnosis || "Unknown Disease",
        severity: severityLevel,
        severity_percent: severityPercent,
        organic_diagnosis: organicTreatment,
        chemical_diagnosis: chemicalTreatment
      };
      
      console.log('Final processed result:', finalResult);
      return finalResult;
    } else if (Array.isArray(result) && result.length > 0 && result[0].response && result[0].response.output) {
      // Handle the actual response format: result[0].response.output
      const output = result[0].response.output;
      console.log('Found response.output field:', output);
      
      // Clean and format treatment recommendations
      const cleanTreatmentText = (text: string) => {
        return text
          .replace(/\s*\(e\.g\.,?\s*/g, ' (for example: ') // Fix e.g. formatting
          .replace(/\s*\(e\.g\.\s*/g, ' (for example ') // Handle cases without comma
          .replace(/\)\s*with\s+/g, ') - ') // Clean up parentheses followed by "with"
          .trim();
      };

      // Convert organic and chemical treatments from arrays to formatted strings
      const organicTreatment = Array.isArray(output.OrganicTreatment) 
        ? output.OrganicTreatment.map(cleanTreatmentText).join('\n• ') 
        : cleanTreatmentText(output.OrganicTreatment || "Apply organic treatments as recommended by agricultural specialist.");
        
      const chemicalTreatment = Array.isArray(output.ChemicalTreatment)
        ? output.ChemicalTreatment.map(cleanTreatmentText).join('\n• ')
        : cleanTreatmentText(output.ChemicalTreatment || "Consult with agricultural specialist for chemical treatment options.");

      // Map severity to proper format - handle both numeric and text severity
      let severityPercent = 50;
      let severityLevel = "Moderate";
      
      if (typeof output.Severity === 'number') {
        severityPercent = output.Severity;
      } else if (typeof output.Severity === 'string') {
        // Parse text severity like "Mild to moderate"
        if (output.Severity.toLowerCase().includes('mild')) {
          severityPercent = 25;
          severityLevel = "Mild";
        } else if (output.Severity.toLowerCase().includes('severe')) {
          severityPercent = 75;
          severityLevel = "Severe";
        } else {
          severityPercent = 50;
          severityLevel = "Moderate";
        }
      }

      const finalResult = {
        disease: output.Diagnosis || "Unknown Disease",
        severity: severityLevel,
        severity_percent: severityPercent,
        organic_diagnosis: organicTreatment,
        chemical_diagnosis: chemicalTreatment
      };
      
      console.log('Final processed result from response.output:', finalResult);
      return finalResult;
    } else if (result && typeof result === 'object' && !Array.isArray(result) && result.output) {
      // Handle direct object format: result.output (your actual format)
      const output = result.output;
      console.log('Found direct output field:', output);
      
      // Clean and format treatment recommendations
      const cleanTreatmentText = (text: string) => {
        return text
          .replace(/\s*\(e\.g\.,?\s*/g, ' (for example: ')
          .replace(/\s*\(e\.g\.\s*/g, ' (for example ')
          .replace(/\)\s*with\s+/g, ') - ')
          .trim();
      };

      // Convert organic and chemical treatments from arrays to formatted strings
      const organicTreatment = Array.isArray(output.OrganicTreatment) 
        ? output.OrganicTreatment.map(cleanTreatmentText).join('\n• ') 
        : cleanTreatmentText(output.OrganicTreatment || "Apply organic treatments as recommended by agricultural specialist.");
        
      const chemicalTreatment = Array.isArray(output.ChemicalTreatment)
        ? output.ChemicalTreatment.map(cleanTreatmentText).join('\n• ')
        : cleanTreatmentText(output.ChemicalTreatment || "Consult with agricultural specialist for chemical treatment options.");

      // Map severity to proper format - handle both numeric and text severity
      let severityPercent = 50;
      let severityLevel = "Moderate";
      
      if (typeof output.Severity === 'number') {
        severityPercent = output.Severity;
      } else if (typeof output.Severity === 'string') {
        // Parse text severity like "Mild to moderate"
        if (output.Severity.toLowerCase().includes('mild')) {
          severityPercent = 25;
          severityLevel = "Mild";
        } else if (output.Severity.toLowerCase().includes('severe')) {
          severityPercent = 75;
          severityLevel = "Severe";
        } else {
          severityPercent = 50;
          severityLevel = "Moderate";
        }
      }

      const finalResult = {
        disease: output.Diagnosis || "Unknown Disease",
        severity: severityLevel,
        severity_percent: severityPercent,
        organic_diagnosis: organicTreatment,
        chemical_diagnosis: chemicalTreatment
      };
      
      console.log('Final processed result from direct output:', finalResult);
      return finalResult;
    } else {
      console.error('Invalid webhook response structure:', result);
      console.error('Expected: Array with output field, got:', {
        isArray: Array.isArray(result),
        length: Array.isArray(result) ? result.length : 'N/A',
        hasOutput: Array.isArray(result) && result.length > 0 ? !!result[0].output : false
      });
      
      // Try to extract information from different response formats
      console.log('Attempting to parse alternative response format...');
      
      // Check if response is directly an object with the fields we need
      if (result && typeof result === 'object' && !Array.isArray(result)) {
        console.log('Found direct object response, checking for fields...');
        
        // Look for common field names
        const diagnosis = result.Diagnosis || result.diagnosis || result.Disease || result.disease;
        const organicTreatment = result.OrganicTreatment || result.organicTreatment || result.Organic || result.organic;
        const chemicalTreatment = result.ChemicalTreatment || result.chemicalTreatment || result.Chemical || result.chemical;
        const severity = result.Severity || result.severity;
        
        if (diagnosis || organicTreatment || chemicalTreatment) {
          console.log('Found usable fields in direct response:', { diagnosis, organicTreatment, chemicalTreatment, severity });
          
          const cleanTreatmentText = (text: string) => {
            return text
              .replace(/\s*\(e\.g\.,?\s*/g, ' (for example: ')
              .replace(/\s*\(e\.g\.\s*/g, ' (for example ')
              .replace(/\)\s*with\s+/g, ') - ')
              .trim();
          };

          const organicFormatted = Array.isArray(organicTreatment) 
            ? organicTreatment.map(cleanTreatmentText).join('\n• ') 
            : cleanTreatmentText(organicTreatment || "Apply organic treatments as recommended by agricultural specialist.");
            
          const chemicalFormatted = Array.isArray(chemicalTreatment)
            ? chemicalTreatment.map(cleanTreatmentText).join('\n• ')
            : cleanTreatmentText(chemicalTreatment || "Consult with agricultural specialist for chemical treatment options.");

          let severityPercent = 50;
          let severityLevel = "Moderate";
          
          if (typeof severity === 'number') {
            severityPercent = severity;
          } else if (typeof severity === 'string') {
            if (severity.toLowerCase().includes('mild')) {
              severityPercent = 25;
              severityLevel = "Mild";
            } else if (severity.toLowerCase().includes('severe')) {
              severityPercent = 75;
              severityLevel = "Severe";
            } else {
              severityPercent = 50;
              severityLevel = "Moderate";
            }
          }

          const fallbackResult = {
            disease: diagnosis || "Unknown Disease",
            severity: severityLevel,
            severity_percent: severityPercent,
            organic_diagnosis: organicFormatted,
            chemical_diagnosis: chemicalFormatted
          };
          
          console.log('Fallback result created:', fallbackResult);
          return fallbackResult;
        }
      }
      
      throw new Error('Invalid webhook response format - missing output field and no usable fallback fields found');
    }

  } catch (error) {
    console.error('Webhook analysis error:', error);
    
    // Only use fallback if explicitly requested or after retries
    throw error; // Re-throw the error to let the calling function handle it
  }
}

// Extend Express Request to include session user
declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize MongoDB connection
  await connectToDatabase();

  // Configure session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
  }));

  // Middleware to check if user is authenticated
  const requireAuth = (req: Request, res: any, next: any) => {
    // Debug: Log session info
    console.log('requireAuth - Session ID:', req.sessionID);
    console.log('requireAuth - Session userId:', req.session.userId);
    console.log('requireAuth - Session exists:', !!req.session);
    
    if (!req.session.userId) {
      console.log('requireAuth - Authentication failed: no userId in session');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    console.log('requireAuth - Authentication successful');
    next();
  };

  // Register/Signup endpoint
  app.post('/api/auth/register', async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await mongoStorage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      
      // Create user
      const user = await mongoStorage.createUser({
        username: validatedData.username,
        password: hashedPassword
      });

      // Start session
      req.session.userId = user.id;

      res.json({
        id: user.id,
        username: user.username,
        createdAt: user.createdAt
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ 
        error: 'Registration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Login endpoint
  app.post('/api/auth/login', async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      // Find user
      const user = await mongoStorage.getUserByUsername(validatedData.username);
      if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // Verify password
      const isValid = await bcrypt.compare(validatedData.password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // Start session
      req.session.userId = user.id;

      res.json({
        id: user.id,
        username: user.username,
        createdAt: user.createdAt
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ 
        error: 'Login failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  // Get current user endpoint
  app.get('/api/auth/user', requireAuth, async (req, res) => {
    try {
      const user = await mongoStorage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        id: user.id,
        username: user.username,
        createdAt: user.createdAt
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to get user info' });
    }
  });
  // Test webhook endpoint
  app.post("/api/test-webhook", async (req, res) => {
    try {
      console.log('Testing webhook directly...');
      
      // Send a test request to the webhook
      const testData = { test: "data" };
      const response = await fetch('https://n8n-803689514411.europe-west2.run.app/webhook-test/c96ccd04-d1e1-48b3-9c5d-552deff91c6e', {
        method: 'POST',
        body: JSON.stringify(testData),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Test webhook response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to read error response');
        return res.status(response.status).json({ 
          error: `Webhook test failed: ${response.status} ${response.statusText}`,
          details: errorText
        });
      }

      const responseText = await response.text();
      console.log('Test webhook raw response:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        return res.status(500).json({ 
          error: 'Failed to parse webhook response as JSON',
          rawResponse: responseText
        });
      }

      res.json({
        success: true,
        webhookResponse: result,
        responseStructure: {
          type: typeof result,
          isArray: Array.isArray(result),
          keys: typeof result === 'object' ? Object.keys(result) : 'N/A',
          arrayLength: Array.isArray(result) ? result.length : 'N/A'
        }
      });

    } catch (error) {
      console.error('Webhook test error:', error);
      res.status(500).json({ 
        error: "Failed to test webhook",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Image analysis endpoint (requires authentication)
  app.post("/api/analyze", requireAuth, upload.single('image'), async (req: Request, res) => {
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

      // Store analysis in database with user ID
      const analysis = await mongoStorage.createAnalysis({
        userId: req.session.userId!,
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

  // Get user's analysis history
  app.get("/api/analyses", requireAuth, async (req, res) => {
    try {
      const analyses = await mongoStorage.getAnalysesByUserId(req.session.userId!);
      res.json(analyses.slice(0, 10)); // Return last 10 analyses
    } catch (error) {
      console.error('Error fetching analyses:', error);
      res.status(500).json({ error: "Failed to fetch analysis history" });
    }
  });

  // Get user statistics
  app.get("/api/user/stats", requireAuth, async (req, res) => {
    try {
      const stats = await mongoStorage.getUserStats(req.session.userId!);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      res.status(500).json({ error: "Failed to fetch user statistics" });
    }
  });

  // Delete user account
  app.delete("/api/user", requireAuth, async (req, res) => {
    try {
      await mongoStorage.deleteUser(req.session.userId!);
      
      // Destroy session after deleting user
      req.session.destroy((err) => {
        if (err) {
          console.error('Error destroying session:', err);
        }
      });
      
      res.json({ message: "User account deleted successfully" });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: "Failed to delete user account" });
    }
  });

  // Delete specific analysis
  app.delete("/api/analyses/:id", requireAuth, async (req, res) => {
    try {
      await mongoStorage.deleteAnalysis(req.params.id, req.session.userId!);
      res.json({ message: "Analysis deleted successfully" });
    } catch (error) {
      console.error('Error deleting analysis:', error);
      res.status(500).json({ error: "Failed to delete analysis" });
    }
  });

  // Delete all user analyses
  app.delete("/api/analyses", requireAuth, async (req, res) => {
    try {
      await mongoStorage.deleteAllUserAnalyses(req.session.userId!);
      res.json({ message: "All analyses deleted successfully" });
    } catch (error) {
      console.error('Error deleting all analyses:', error);
      res.status(500).json({ error: "Failed to delete all analyses" });
    }
  });

  // Get specific analysis (user can only access their own)
  app.get("/api/analyses/:id", requireAuth, async (req, res) => {
    try {
      const analysis = await mongoStorage.getAnalysis(req.params.id);
      if (!analysis) {
        return res.status(404).json({ error: "Analysis not found" });
      }
      
      // Check if analysis belongs to current user
      if (analysis.userId !== req.session.userId) {
        return res.status(403).json({ error: "Access denied" });
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
