const BASE_SYSTEM_PROMPT = `You are Breezely, an intelligent web agent. Respond ONLY in valid JSON.

ACTIONS:
CLICK {"action":"CLICK","elementId":<n>}
SCROLL {"action":"SCROLL","direction":"UP"|"DOWN"}
TYPE {"action":"TYPE","elementId":<n>,"text":"..."}
NAVIGATE {"action":"NAVIGATE","url":"..."}
TRANSLATE {"action":"TRANSLATE","language":"<code>"}
ANSWER {"action":"ANSWER","text":"..."}

RULES:
1. DOM interactions MUST use the numeric elementId from CURRENT BROWSER CONTEXT. Never guess element IDs.
2. General questions or searches → ANSWER with your built-in knowledge. Do not navigate for general Q&A.
3. If you need user input (OTP, captcha text, confirmation) → ANSWER to ask, then wait for their reply.
4. CAPTCHAS: Never guess. Ask the user via ANSWER, then TYPE their reply into the captcha field.
5. OTPs: After clicking Send OTP, use ANSWER to ask the user for the code. Once they reply, TYPE it. Never fabricate OTPs.
6. Execute ONE action per response. Continue multi-step tasks by returning the next action on each turn.
7. NAVIGATE: If user says go to / open / visit a site in any language, issue NAVIGATE to that URL immediately.
8. TRANSLATE: Use the correct 2- or 3-letter BCP-47 language code (hi=Hindi, bn=Bengali, as=Assamese, brx=Bodo, en=English).
9. Avoid infinite loops: If you have scrolled 3+ times without finding the target, stop and ANSWER explaining why.
10. Do not navigate to Aadhaar or similar pages repeatedly — the "exceeded page view" error is triggered by reloads. Interact with fields already on the page.
11. E-commerce: Prefer items labelled "Amazon's Choice" or with high ratings. Add to cart directly.
12. No legal or medical advice — redirect to official sources via ANSWER.
13. If an action fails, choose an alternative approach. Do not repeat the same failed action.
14. End a workflow with ANSWER when the goal is complete or when you need user input to continue.`;

/**
 * Gemini API implementation for the browser
 */
async function chatWithGemini(messagesArray = [], pageContent = "", elements = {}, url = "", title = "", apiKey = "", signal = null, modelId = null) {
    try {
        if (!apiKey) throw new Error("Gemini API Key is missing.");

        const finalModelId = modelId || "gemini-pro-latest"; 
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${finalModelId}:generateContent?key=${apiKey}`;

        // Trim elements for context window efficiency
        let trimmedElements = elements;
        if (elements && elements.interactable && Array.isArray(elements.interactable)) {
            const PRIORITY_TYPES = ['input', 'button', 'a', 'select', 'textarea'];
            const interactive = elements.interactable
                .filter(el => PRIORITY_TYPES.includes(el.type) || PRIORITY_TYPES.includes(el.tag))
                .slice(0, 40);
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

            if (role === "user" && msg === messagesArray.filter(m => m.role === 'user').pop()) {
                if (pageContent || url) {
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

        const payload = {
            contents: contents,
            systemInstruction: { parts: [{ text: BASE_SYSTEM_PROMPT }] },
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.7
            }
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: signal
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || "Gemini API request failed");
        }

        const data = await response.json();
        const fullText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!fullText) throw new Error("Invalid response from Gemini");
        return JSON.parse(fullText);

    } catch (error) {
        console.error("Gemini Error:", error);
        return { action: "ANSWER", text: `Error: ${error.message}` };
    }
}

/**
 * Claude API implementation for the browser
 */
async function chatWithClaude(messagesArray = [], pageContent = "", elements = {}, url = "", title = "", apiKey = "", signal = null, modelId = null) {
    try {
        if (!apiKey) throw new Error("Claude API Key is missing.");

        const apiUrl = "https://api.anthropic.com/v1/messages";
        const finalModelId = modelId || "claude-4-sonnet";

        const apiMessages = messagesArray.map(m => ({ ...m }));
        let lastUserMsg = null;
        for (let i = apiMessages.length - 1; i >= 0; i--) {
            if (apiMessages[i].role === "user") {
                lastUserMsg = apiMessages[i];
                break;
            }
        }

        if (lastUserMsg) {
            lastUserMsg.content = `[CONTEXT] URL: ${url} | TITLE: ${title}\nDOM: ${pageContent ? pageContent.substring(0, 1500) : ""}\nELEMENTS: ${JSON.stringify(elements)}\n\nCommand: ${lastUserMsg.content}`;
        }

        // Claude specific cleanup: filter and format
        const claudeMessages = [];
        for (const msg of apiMessages) {
            if (claudeMessages.length > 0 && claudeMessages[claudeMessages.length - 1].role === msg.role) {
                claudeMessages[claudeMessages.length - 1].content += "\n" + msg.content;
                continue;
            }
            
            const parts = [{ type: "text", text: msg.content }];
            if (msg.image_data) {
                const match = msg.image_data.match(/^data:(image\/[^;]+);base64,(.*)$/);
                if (match) {
                    parts.push({
                        type: "image",
                        source: { type: "base64", media_type: match[1], data: match[2] }
                    });
                }
            }
            claudeMessages.push({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: parts });
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
                "dangerously-allow-browser": "true" 
            },
            body: JSON.stringify({
                model: finalModelId,
                max_tokens: 1024,
                system: BASE_SYSTEM_PROMPT,
                messages: claudeMessages,
                temperature: 0.1
            }),
            signal: signal
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err || "Claude API request failed");
        }

        const data = await response.json();
        let content = data.content?.[0]?.text || "";
        content = content.replace(/```json/gi, '').replace(/```/g, '').trim();
        const match = content.match(/\{[\s\S]*\}/);
        return JSON.parse(match ? match[0] : content);

    } catch (error) {
        console.error("Claude Error:", error);
        return { action: "ANSWER", text: `Error: ${error.message}` };
    }
}

/**
 * OpenAI API implementation for the browser
 */
async function chatWithOpenAI(messagesArray = [], pageContent = "", elements = {}, url = "", title = "", apiKey = "", signal = null, modelId = null) {
    try {
        if (!apiKey) throw new Error("OpenAI API Key is missing.");

        const apiUrl = "https://api.openai.com/v1/chat/completions";
        const finalModelId = modelId || "gpt-5.4";

        const apiMessages = messagesArray.map(m => ({ ...m }));
        let lastUserMsg = null;
        for (let i = apiMessages.length - 1; i >= 0; i--) {
            if (apiMessages[i].role === "user") {
                lastUserMsg = apiMessages[i];
                break;
            }
        }

        if (lastUserMsg) {
            lastUserMsg.content = `[CONTEXT] URL: ${url} | TITLE: ${title}\nDOM: ${pageContent ? pageContent.substring(0, 1500) : ""}\nELEMENTS: ${JSON.stringify(elements)}\n\nCommand: ${lastUserMsg.content}`;
        }

        const openaiMessages = [{ role: "system", content: BASE_SYSTEM_PROMPT }];
        for (const msg of apiMessages) {
            const contentParts = [{ type: "text", text: msg.content }];
            if (msg.image_data) {
                contentParts.push({ type: "image_url", image_url: { url: msg.image_data, detail: "high" } });
            }
            openaiMessages.push({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: contentParts });
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: finalModelId,
                messages: openaiMessages,
                temperature: 0.1,
                response_format: { type: "json_object" }
            }),
            signal: signal
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err || "OpenAI API request failed");
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        return JSON.parse(content);

    } catch (error) {
        console.error("OpenAI Error:", error);
        return { action: "ANSWER", text: `Error: ${error.message}` };
    }
}

/**
 * Bhashini Translation API implementation for the browser
 */
async function translateTextsBhashini(textsArray, targetLang = 'as') {
    if (!textsArray || textsArray.length === 0) return [];
    
    // Default key if not provided by user
    const BHASHINI_KEY = "KbA_dh-JvZvKpjo152OjtWmHPGindblWZNX-Usvx0SxqP0l0pzGgWoWcRwQ-WuoE";
    const BHASHINI_ENDPOINT = "https://dhruva-api.bhashini.gov.in/services/inference/pipeline";

    const translatedTexts = [];
    const BATCH_SIZE = 25; // Smaller batch for browser to avoid timeouts

    for (let i = 0; i < textsArray.length; i += BATCH_SIZE) {
        const batch = textsArray.slice(i, i + BATCH_SIZE);
        const payload = {
            pipelineTasks: [{
                taskType: "translation",
                config: {
                    language: { sourceLanguage: "en", targetLanguage: targetLang }
                }
            }],
            inputData: { input: batch.map(text => ({ source: text })) }
        };

        try {
            const response = await fetch(BHASHINI_ENDPOINT, {
                method: 'POST',
                headers: {
                    "Authorization": BHASHINI_KEY,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("Bhashini translation failed");

            const data = await response.json();
            const outputs = data.pipelineResponse?.[0]?.output || [];
            outputs.forEach(out => translatedTexts.push(out.target));
        } catch (error) {
            console.error("Bhashini Batch Error:", error);
            batch.forEach(text => translatedTexts.push(text));
        }
    }

    return translatedTexts;
}
