const { GoogleGenAI } = require('@google/genai');
const { baseSystemPrompt } = require('./prompt');

async function chatWithGemini(messagesArray = [], pageContent = "", elements = {}, url = "", title = "", apiKeyData = null) {
    try {
        const apiKey = (typeof apiKeyData === 'object' && apiKeyData !== null) ? apiKeyData.key : apiKeyData || process.env.GEMINI_API_KEY;
        const modelId = (typeof apiKeyData === 'object' && apiKeyData !== null) ? apiKeyData.modelId : "gemini-flash-latest";

        const ai = new GoogleGenAI({ apiKey });

        // OPT: Slim the elements payload — only keep top 40 interactive elements.
        // On Amazon, the full list can be 300+ items which bloats the prompt badly.
        let trimmedElements = elements;
        if (elements && elements.interactable && Array.isArray(elements.interactable)) {
            const PRIORITY_TYPES = ['input', 'button', 'a', 'select', 'textarea'];
            const interactive = elements.interactable
                .filter(el => PRIORITY_TYPES.includes(el.type) || PRIORITY_TYPES.includes(el.tag))
                .slice(0, 40);
            // Include remaining slots from non-priority if we have room
            const rest = elements.interactable
                .filter(el => !PRIORITY_TYPES.includes(el.type) && !PRIORITY_TYPES.includes(el.tag))
                .slice(0, Math.max(0, 40 - interactive.length));
            trimmedElements = {
                interactable: [...interactive, ...rest],
                headings: elements.headings ? elements.headings.slice(0, 10) : []
            };
        }

        const contents = [];
        for (const msg of messagesArray) {
            const role = msg.role === "assistant" ? "model" : "user";
            let textContent = msg.content;

            // If it's a browser task, append context to the LAST user message
            if (role === "user" && msg === messagesArray.filter(m => m.role === 'user').pop()) {
                if (pageContent || url) {
                    // OPT: Trimmed DOM text from 2000 → 1500 chars (still enough for most pages)
                    textContent = `[BROWSER CONTEXT]\nURL: ${url}\nTITLE: ${title}\nDOM: ${pageContent ? pageContent.substring(0, 1500) : "N/A"}\nELEMENTS: ${JSON.stringify(trimmedElements)}\n\n[USER COMMAND]\n${msg.content}`;
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

        const tStart = Date.now();
        console.log(`Sending to Gemini (@google/genai) using model: ${modelId}...`);

        // OPT: Use streaming so the backend gets the first token sooner.
        // We still collect the full response before parsing JSON.
        const stream = await ai.models.generateContentStream({
            model: modelId,
            contents: contents,
            config: {
                systemInstruction: baseSystemPrompt,
                responseMimeType: "application/json",
                temperature: 0.7
            }
        });

        let fullText = '';
        for await (const chunk of stream) {
            if (chunk.text) fullText += chunk.text;
        }

        console.log(`Gemini Response (${Date.now() - tStart}ms):`, fullText);
        return JSON.parse(fullText);

    } catch (error) {
        console.error("Gemini Critical Error:", error);
        return { action: "ANSWER", text: `Breezely encountered an error: ${error.message}` };
    }
}

module.exports = { chatWithGemini };
