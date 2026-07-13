import express from 'express';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: 'uploads/' });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post('/api/analyze', upload.single('document'), async (req, res) => {
    try {
      const file = req.file;
      const { taskType } = req.body;

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        fs.unlinkSync(file.path);
        return res.status(500).json({ error: 'Gemini API key is not configured.' });
      }

      const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });

      // Upload to Gemini
      const uploadResult = await ai.files.upload({
        file: file.path,
        config: {
          mimeType: file.mimetype,
        }
      });

      let prompt = '';
      switch (taskType) {
        case 'summary':
          prompt = 'Analyze the uploaded document and provide a comprehensive academic summary. Highlight the key arguments, methodology, and conclusions. Use Google Search to enrich the summary with up-to-date context or related information if relevant. Format the response beautifully using Markdown.';
          break;
        case 'report':
          prompt = 'Analyze the uploaded document and generate a structured formal report based on its contents. Include an executive summary, main findings, and actionable recommendations if applicable. Use Google Search to include up-to-date relevant statistics or context if needed. Format the response beautifully using Markdown.';
          break;
        case 'presentation':
          prompt = 'Analyze the uploaded document and create an outline for a presentation. Provide slide-by-slide content including slide titles, bullet points, and speaker notes. Use Google Search to add up-to-date real-world examples if relevant. Format the response beautifully using Markdown.';
          break;
        default:
          prompt = 'Analyze this document and summarize its contents. Use Google Search to add up-to-date context if needed. Format the response using Markdown.';
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
          { fileData: { fileUri: uploadResult.uri, mimeType: uploadResult.mimeType } },
          { text: prompt }
        ],
        config: {
          tools: [{ googleSearch: {} }],
        }
      });

      // Cleanup local file
      fs.unlinkSync(file.path);

      res.json({ result: response.text });
    } catch (error: any) {
      console.error('Error during analysis:', error);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: error.message || 'An error occurred during analysis' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global error handler for API routes
  app.use('/api', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('API Error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
