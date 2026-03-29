const fetch = require('node-fetch');
const { baseSystemPrompt } = require('./prompt');

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_MODEL_ID = process.env.CLAUDE_MODEL_ID || "claude-sonnet-4-20250514";

async function chatWithClaude(messagesArray = [], pageContent = "", elements = {}, url = "", title = "") {
    const apiUrl = "https://api.anthropic.com/v1/messages";

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

    // Clean up consecutive roles: Claude requires strictly alternating user -> assistant -> user
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

    // Convert to Claude's message format (role: user/assistant, content as string or array)
    const claudeMessages = cleanedMessages.map(msg => {
        const parts = [];

        if (msg.content) parts.push({ type: "text", text: msg.content });

        if (msg.image_data) {
            const match = msg.image_data.match(/^data:(image\/[^;]+);base64,(.*)$/);
            if (match) {
                parts.push({
                    type: "image",
                    source: {
                        type: "base64",
                        media_type: match[1],
                        data: match[2]
                    }
                });
            }
        }

        return {
            role: msg.role === "assistant" ? "assistant" : "user",
            content: parts
        };
    });

    const payload = {
        model: CLAUDE_MODEL_ID,
        max_tokens: 1024,
        system: baseSystemPrompt,
        messages: claudeMessages,
        temperature: 0.1
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                "x-api-key": CLAUDE_API_KEY,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("Claude API HTTP Error:", errText);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errText}`);
        }

        const data = await response.json();
        let content = data.content && data.content[0] ? data.content[0].text : null;

        console.log("----------------------");
        console.log("raw content from claude:", content);
        console.log("----------------------");

        if (!content || content.trim() === "") {
            console.log("Claude API returned empty content.");
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
        console.error("Claude API Error:", error);
        return { action: "ANSWER", text: "An error occurred while connecting to Claude. Please verify your API key and try again." };
    }
}

module.exports = { chatWithClaude };
