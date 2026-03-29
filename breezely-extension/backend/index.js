require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { chatWithGemini } = require('./gemini');
const { chatWithClaude } = require('./claude');
const { chatWithOpenAI } = require('./openai');
const { translateTexts } = require('./bhashini');

const app = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Routes
app.get('/', (req, res) => {
    res.json({
        message: "Welcome to Breezely API!",
        status: "online",
        endpoints: {
            chat: "POST /chat",
            translate: "POST /translate"
        },
        models: ["gemini", "claude", "openai"]
    });
});

app.post('/chat', async (req, res) => {
    console.log("RECEIVED /chat request:", Date.now());
    console.log("Payload messages length:", req.body.messages ? req.body.messages.length : 0);
    try {
        const { messages, page_content, elements, url, title, model, apiKey } = req.body;
        console.log("Requested Model:", model);

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: "messages array is required" });
        }

        let result;

        // Use user-provided API key if available (from frontend console), 
        // otherwise fall back to env vars
        if (model === 'claude') {
            if (apiKey) process.env.CLAUDE_API_KEY = apiKey;
            result = await chatWithClaude(messages, page_content, elements, url, title);
        } else if (model === 'openai') {
            if (apiKey) process.env.OPENAI_API_KEY = apiKey;
            result = await chatWithOpenAI(messages, page_content, elements, url, title);
        } else {
            // Default: Gemini
            if (apiKey) process.env.GEMINI_API_KEY = apiKey;
            result = await chatWithGemini(messages, page_content, elements, url, title);
        }

        res.json({
            action: result.action || "ANSWER",
            elementId: result.elementId,
            direction: result.direction,
            text: result.text,
            url: result.url,
            language: result.language
        });

    } catch (error) {
        console.error("Chat endpoint error:", error);
        res.status(500).json({
            action: "ANSWER",
            text: "An error occurred. Please verify your API key and connection."
        });
    }
});

app.post('/translate', async (req, res) => {
    try {
        const { texts, targetLanguage } = req.body;

        if (!texts || !Array.isArray(texts)) {
            return res.status(400).json({ error: "texts array is required" });
        }

        let translatedTexts = await translateTexts(texts, targetLanguage || 'as');

        if (!translatedTexts || translatedTexts.length === 0) {
            throw new Error("Translation failed");
        }

        res.json({ translated_texts: translatedTexts });

    } catch (error) {
        console.error("Translate endpoint error:", error);
        res.status(500).json({
            error: "Translation failed. Please verify your connection."
        });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Breezely backend listening at http://localhost:${port}`);
});
