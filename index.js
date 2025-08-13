const express = require('express');
const dotenv = require('dotenv');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();
const app = express();
const port = 3000;
const upload = multer({ dest: 'uploads/' });
app.use(express.json());

// Helper function to convert file to a generative part
function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
      mimeType
    },
  };
}

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genai.getGenerativeModel({
  model: 'models/gemini-2.0-flash',
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Generate Text
// This endpoint allows users to generate text based on a prompt
// The prompt is expected to be sent in the request body as JSON with a 'prompt' field
// The response will contain the generated text
app.post('/generate-text', async (req, res) => {
  const { prompt } = req.body;

  try {
    const result = await model.generateContent(prompt);

    const response = await result.response;
    res.json({ text: response.text() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate From Image
// This endpoint allows users to upload an image and generate text based on it
// The image is processed and sent to the Gemini model for text generation
// The image is expected to be sent as a multipart/form-data request with the field name 'image'
// The prompt can be provided in the request body, or a default prompt will be used if not provided
app.post('/generate-from-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    const prompt = req.body.prompt || 'Describe this image';
    const imagePart = fileToGenerativePart(req.file.path, req.file.mimetype);

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);

    res.json({ text });
  } catch (error) {
    // Clean up the file in case of an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

// Generate From Document
// This endpoint allows users to upload a document (PDF, DOCX, etc.) and generate text based on it
// The document is processed and sent to the Gemini model for text generation
// The document is expected to be sent as a multipart/form-data request with the field name 'document'
// The prompt can be provided in the request body, or a default prompt will be used if not provided
app.post('/generate-from-document', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document file uploaded.' });
    }

    const prompt = req.body.prompt || 'Summarize this document';
    const documentPart = fileToGenerativePart(req.file.path, req.file.mimetype);

    const result = await model.generateContent([prompt, documentPart]);
    const response = await result.response;
    const text = response.text();

    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);

    res.json({ text });
  } catch (error) {
    // Clean up the file in case of an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

// Generate From Audio
// This endpoint allows users to upload an audio file and generate text based on it
// The audio file is processed and sent to the Gemini model for transcription or text generation
// The audio file is expected to be sent as a multipart/form-data request with the field name 'audio'
// The prompt can be provided in the request body, or a default prompt will be used if not provided
app.post('/generate-from-audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded.' });
    }

    const prompt = req.body.prompt || 'Transcribe this audio';
    const audioPart = fileToGenerativePart(req.file.path, req.file.mimetype);

    const result = await model.generateContent([prompt, audioPart]);
    const response = await result.response;
    const text = response.text();

    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);

    res.json({ text });
  } catch (error) {
    // Clean up the file in case of an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});