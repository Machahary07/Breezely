const { GoogleGenAI } = require('@google/genai');
const { baseSystemPrompt } = require('./prompt');

async function chatWithGemini(messagesArray = [], pageContent = "", elements = {}, url = "", title = "", apiKeyData = null) {
    try {
        const apiKey = (typeof apiKeyData === 'object' && apiKeyData !== null) ? apiKeyData.key : apiKeyData || process.env.GEMINI_API_KEY;
        const modelId = (typeof apiKeyData === 'object' && apiKeyData !== null) ? apiKeyData.modelId : "gemini-flash-latest";

        const ai = new GoogleGenAI({ apiKey });

        const contents = [];
        for (const msg of messagesArray) {
            const role = msg.role === "assistant" ? "model" : "user";
            let textContent = msg.content;

            // If it's a browser task, append context to the LAST user message
            if (role === "user" && msg === messagesArray.filter(m => m.role === 'user').pop()) {
                if (pageContent || url) {
                    textContent = `[BROWSER CONTEXT]\nURL: ${url}\nTITLE: ${title}\nDOM: ${pageContent ? pageContent.substring(0, 2000) : "N/A"}\nELEMENTS: ${JSON.stringify(elements)}\n\n[USER COMMAND]\n${msg.content}`;
                }
            }

            const parts = [{ text: textContent }];
            if (msg.image_data) {
                const match = msg.image_data.match(/^data:(image\/[^;]+);base64,(.*)$/);
                if (match) {
                    parts.push({
                        inlineData: {
                            mimeType: match[1],
                            data: match[2]
                        }
                    });
                }
            }
            contents.push({ role, parts });
        }

        console.log(`Sending to Gemini (@google/genai) using model: ${modelId}...`);
        const response = await ai.models.generateContent({
            model: modelId,
            contents: contents,
            config: {
                systemInstruction: baseSystemPrompt,
                responseMimeType: "application/json",
                temperature: 0.7
            }
        });

        const text = response.text;

        console.log("Gemini Response:", text);
        return JSON.parse(text);

    } catch (error) {
        console.error("Gemini Critical Error:", error);
        return { action: "ANSWER", text: `Breezely encountered an error: ${error.message}` };
    }
}

module.exports = { chatWithGemini };
