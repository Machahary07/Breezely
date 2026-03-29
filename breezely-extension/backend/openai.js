const fetch = require('node-fetch');
const { baseSystemPrompt } = require('./prompt');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL_ID = process.env.OPENAI_MODEL_ID || "gpt-4o";

async function chatWithOpenAI(messagesArray = [], pageContent = "", elements = {}, url = "", title = "") {
    const apiUrl = "https://api.openai.com/v1/chat/completions";

    const apiMessages = [];

    // Copy the messages over
    for (let i = 0; i < messagesArray.length; i++) {
        apiMessages.push({ ...messagesArray[i] });
    }

    if (apiMessages.length === 0) {
        apiMessages.push({ role: "user", content: "No explicit goal provided." });
    }

    // Inject current DOM into the MOST RECENT user message
    let lastUserMessage = null;
    for (let i = apiMessages.length - 1; i >= 0; i--) {
        if (apiMessages[i].role === "user") {
            lastUserMessage = apiMessages[i];
            break;
        }
    }

    if (lastUserMessage) {
        lastUserMessage.content = `[CURRENT BROWSER CONTEXT]
URL: ${url}
TITLE: ${title}

(Note: The user's query might be completely independent of this page. Only use this context if the user's latest command refers to the page or requires browser automation.)

WEBPAGE CONTENT:
${pageContent ? pageContent.substring(0, 2000) : "No context provided"}

AVAILABLE INTERACTABLE ELEMENTS (map of unique IDs to elements):
${JSON.stringify(elements)}
[END CONTEXT]

LATEST COMMAND:
${lastUserMessage.content}`;
    }

    // Clean up consecutive roles: OpenAI prefers alternating roles  
    const cleanedMessages = [];
    if (apiMessages.length > 0) {
        cleanedMessages.push(apiMessages[0]);
        for (let i = 1; i < apiMessages.length; i++) {
            const currentRole = apiMessages[i].role;
            const prevRole = cleanedMessages[cleanedMessages.length - 1].role;

            if (currentRole === prevRole) {
                // Merge consecutive messages of the same role
                cleanedMessages[cleanedMessages.length - 1].content += `\n${apiMessages[i].content}`;
            } else {
                cleanedMessages.push(apiMessages[i]);
            }
        }
    }

    // Convert to OpenAI's message format with vision support
    const openaiMessages = [
        { role: "system", content: baseSystemPrompt }
    ];

    for (const msg of cleanedMessages) {
        const openaiMsg = {
            role: msg.role === "assistant" ? "assistant" : "user",
            content: []
        };

        if (msg.content) {
            openaiMsg.content.push({ type: "text", text: msg.content });
        }

        if (msg.image_data) {
            openaiMsg.content.push({
                type: "image_url",
                image_url: {
                    url: msg.image_data,
                    detail: "high"
                }
            });
        }

        // If content is a single text, simplify for non-vision messages
        if (openaiMsg.content.length === 1 && openaiMsg.content[0].type === "text") {
            openaiMsg.content = openaiMsg.content[0].text;
        }

        openaiMessages.push(openaiMsg);
    }

    const payload = {
        model: OPENAI_MODEL_ID,
        messages: openaiMessages,
        temperature: 0.1,
        response_format: { type: "json_object" }
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("OpenAI API HTTP Error:", errText);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errText}`);
        }

        const data = await response.json();
        let content = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : null;

        console.log("----------------------");
        console.log("raw content from openai:", content);
        console.log("----------------------");

        if (!content || content.trim() === "") {
            console.log("OpenAI API returned empty content.");
            return { action: "ANSWER", text: "I'm having trouble understanding right now. Please try again or provide more details." };
        }

        // Clean up JSON markup if present
        content = content.replace(/```json/gi, '').replace(/```/g, '').trim();

        // Extract JSON if there's surrounding text
        if (!content.startsWith('{')) {
            const match = content.match(/\{[\s\S]*\}/);
            if (match) {
                content = match[0];
            }
        }

        return JSON.parse(content);

    } catch (error) {
        console.error("OpenAI API Error:", error);
        return { action: "ANSWER", text: "An error occurred while connecting to OpenAI. Please verify your API key and try again." };
    }
}

module.exports = { chatWithOpenAI };
