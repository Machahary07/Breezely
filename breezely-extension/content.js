if (!window.__1e_content_script_injected) {
    window.__1e_content_script_injected = true;

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === "EXTRACT_CONTEXT") {
            const context = extractContext();
            sendResponse(context);
        } else if (request.type === "EXECUTE_COMMAND") {
            executeCommand(request.command);
            sendResponse({ status: "success" });
        } else if (request.type === "EXTRACT_TEXT_NODES") {
            const texts = extractTextNodes();
            sendResponse({ texts: texts });
        } else if (request.type === "INJECT_TRANSLATION") {
            injectTranslation(request.translatedTexts);
            sendResponse({ status: "success" });
        } else if (request.type === "START_DYNAMIC_TRANSLATION") {
            startDynamicTranslation(request.targetLang);
            sendResponse({ status: "success" });
        } else if (request.type === "STOP_DYNAMIC_TRANSLATION") {
            stopDynamicTranslation();
            sendResponse({ status: "success" });
        } else if (request.type === "REVERT_TRANSLATION") {
            revertTranslation();
            sendResponse({ status: "success" });
        } else if (request.type === "GET_PAGE_TEXT") {
            sendResponse({ text: document.body.innerText });
        }
        return true;
    });

    // Listen for API key sync messages directly from the Breezely Frontend Console
    window.addEventListener('message', async (event) => {
        // Only accept from same window
        if (event.source !== window || !event.data) return;

        // Security check: Only trust messages from your actual Console domains
        const trustedOrigins = [
            'http://localhost:4200', 
            'https://breezely.intellaris.co',
            'https://breezely-001.web.app',
            'https://breezely-001.firebaseapp.com'
        ];
        
        if (!trustedOrigins.includes(event.origin)) return;

        if (event.data.type === 'BREEZELY_API_KEYS_SYNC') {
            const keys = event.data.keys;
            
            // Relay keys to the extension background/sidebar 
            // Content scripts cannot directly access chrome.storage.local in some contexts
            chrome.runtime.sendMessage({ 
                type: 'BREEZELY_API_KEYS_SYNC_RELAY', 
                keys: keys 
            });
            console.log("Breezely Agent: Relaying API keys from console to extension.");
        }
    });
}

let nextElementId = 1;

function extractContext() {
    // Clean up old IDs
    document.querySelectorAll('[data-1e-id]').forEach(el => el.removeAttribute('data-1e-id'));
    nextElementId = 1;

    // OPT: Trim body text from 8000 → 4000 chars. The model uses this for context
    // only; the structured elements list is the primary navigation signal.
    const text = document.body ? document.body.innerText.substring(0, 4000) : "";

    const inputs = [];
    try {
        document.querySelectorAll('input:not([type="hidden"]), textarea, select, [contenteditable="true"]').forEach(i => {
            if (i.offsetParent !== null) {
                const label = (i.placeholder || i.name || i.id || i.value || i.innerText || i.getAttribute('aria-label') || "input").substring(0, 50);
                i.setAttribute('data-1e-id', nextElementId);
                inputs.push({ id: nextElementId, name: label, type: i.type || i.tagName.toLowerCase() });
                nextElementId++;
            }
        });
    } catch (e) {
        console.warn("Failed to extract input elements", e);
    }

    const buttons = [];
    // OPT: Skip structural/decorative tags (nav, footer, header icons) — these are
    // almost never what the model needs to click and they bloat the payload.
    const SKIP_TAGS = new Set(['nav', 'header', 'footer']);
    try {
        document.querySelectorAll('button, a, [role="button"], [role="link"], [role="tab"], [tabindex], [onclick], li, .card, .track01').forEach(b => {
            if (b.offsetParent !== null) { // only visible
                // Skip elements inside purely structural containers
                if (b.closest('nav, footer') && b.tagName.toLowerCase() !== 'button') return;
                const label = (b.innerText || b.value || b.getAttribute('aria-label') || "").trim().substring(0, 100);
                if (label && !b.hasAttribute('data-1e-id')) {
                    b.setAttribute('data-1e-id', nextElementId);
                    buttons.push({ id: nextElementId, text: label, tag: b.tagName.toLowerCase() });
                    nextElementId++;
                }
            }
        });
    } catch (e) {
        console.warn("Failed to extract button elements", e);
    }

    const images = [];
    try {
        document.querySelectorAll('img').forEach(img => {
            if (img.offsetParent !== null) { // only visible
                const label = (img.alt || img.id || img.src || "image").substring(0, 100);
                if (!img.hasAttribute('data-1e-id')) {
                    img.setAttribute('data-1e-id', nextElementId);
                    images.push({ id: nextElementId, name: label, type: 'image' });
                    nextElementId++;
                }
            }
        });
    } catch (e) {
        console.warn("Failed to extract image elements", e);
    }

    let headings = [];
    try {
        headings = Array.from(document.querySelectorAll('h1, h2, h3'))
            .slice(0, 20)
            .map(h => h.innerText.trim())
            .filter(Boolean);
    } catch (e) {
        console.warn("Failed to extract headings", e);
    }

    return {
        page_content: text,
        elements: {
            // OPT: Reduced cap from 400 → 200 interactable elements.
            // Combined with gemini.js trimming to 40, this reduces round-trip payload size.
            interactable: [...inputs, ...buttons, ...images].slice(0, 200),
            headings: [...new Set(headings)]
        }
    };
}

function executeCommand(command) {
    if (!command || !command.action) return Promise.resolve();

    return new Promise((resolve) => {
        try {
            const action = command.action.toUpperCase();

            if (action === "CLICK" && command.elementId) {
                const el = document.querySelector(`[data-1e-id="${command.elementId}"]`);

                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    setTimeout(() => {
                        el.click();
                        resolve();
                    }, 500);
                } else {
                    console.warn("Element not found for click (ID):", command.elementId);
                    resolve();
                }
            } else if (action === "SCROLL") {
                const dir = (command.direction || "DOWN").toUpperCase();
                if (dir === "DOWN") {
                    window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
                } else {
                    window.scrollBy({ top: -window.innerHeight * 0.8, behavior: 'smooth' });
                }
                setTimeout(resolve, 500);
            } else if (action === "TYPE" && command.elementId && command.text) {
                const el = document.querySelector(`[data-1e-id="${command.elementId}"]`);

                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    setTimeout(() => {
                        el.focus();

                        // Deal with React/React DOM inputs and contenteditables
                        if (el.isContentEditable) {
                            el.innerText = command.text;
                        } else {
                            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
                            const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
                            if (nativeInputValueSetter && el.tagName.toLowerCase() === 'input') {
                                nativeInputValueSetter.call(el, command.text);
                            } else if (nativeTextAreaValueSetter && el.tagName.toLowerCase() === 'textarea') {
                                nativeTextAreaValueSetter.call(el, command.text);
                            } else {
                                el.value = command.text;
                            }
                        }

                        el.dispatchEvent(new Event('input', { bubbles: true }));
                        el.dispatchEvent(new Event('change', { bubbles: true }));

                        setTimeout(() => {
                            // Simulate Enter key to trigger search/submit forms automatically
                            el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));
                            el.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));
                            el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));

                            if (el.form) {
                                const submitBtn = el.form.querySelector('button[type="submit"], input[type="submit"], button:not([type="button"])');
                                if (submitBtn) {
                                    submitBtn.click();
                                } else {
                                    el.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                                }
                            }
                            resolve();
                        }, 100);
                    }, 300);
                } else {
                    console.warn("Element not found for type (ID):", command.elementId);
                    resolve();
                }
            } else if (action === "NAVIGATE" && command.url) {
                window.location.href = command.url;
                // Don't resolve immediately; let the page unload
            } else if (action === "READ_IMAGE" && command.elementId) {
                const el = document.querySelector(`[data-1e-id="${command.elementId}"]`);

                if (el && el.tagName.toLowerCase() === 'img') {
                    // Scroll to ensure it's fully visible and not blocked by sticky headers if possible
                    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

                    // Give it a moment to land and render
                    setTimeout(() => {
                        const rect = el.getBoundingClientRect();
                        // Also need the device pixel ratio for correct cropping later
                        resolve({
                            rect: {
                                x: rect.left,
                                y: rect.top,
                                width: rect.width,
                                height: rect.height
                            },
                            devicePixelRatio: window.devicePixelRatio || 1
                        });
                    }, 500);
                } else {
                    console.warn("Element not found or not an image (ID):", command.elementId);
                    resolve({ error: "Element not found or is not an image." });
                }
            } else {
                resolve({});
            }
        } catch (error) {
            console.error("Error executing command:", error);
            resolve({ error: error.message });
        }
    });
}

let originalTextMap = new Map(); // Store original text for nodes
let translationObserver = null;
let currentTargetLang = null;
let isTranslating = false;
let translatorInstance = null; // For Chrome's window.translation API

async function getTranslator(targetLang) {
    if (targetLang === 'en') return null; // Assume source is en for now
    
    // Check for Chrome's experimental Translation API (Built-in AI)
    // There are several possible paths as the API evolves (window.translation, window.ai.translator)
    const aiAPI = window.translation || (window.ai ? window.ai.translator : null);
    
    if (aiAPI && aiAPI.canTranslate) {
        try {
            const canTranslate = await aiAPI.canTranslate({
                sourceLanguage: 'en',
                targetLanguage: targetLang
            });
            
            if (canTranslate === 'readily' || canTranslate === 'after-download') {
                console.log(`Breezely: Using Chrome's built-in AI Translation for ${targetLang}`);
                return await aiAPI.create({
                    sourceLanguage: 'en',
                    targetLanguage: targetLang
                });
            }
        } catch (e) {
            console.warn("Chrome AI Translation check failed:", e);
        }
    }
    return null;
}

async function startDynamicTranslation(targetLang) {
    if (isTranslating && currentTargetLang === targetLang) return;
    
    isTranslating = true;
    currentTargetLang = targetLang;
    
    // 1. Try to initialize built-in translator
    translatorInstance = await getTranslator(targetLang);
    
    // 2. Initial pass: Translate everything currently on screen
    const texts = extractTextNodes(); // This also populates originalTextMap
    
    if (translatorInstance) {
        // Use local API
        const batchSize = 10;
        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize);
            const translations = await Promise.all(batch.map(t => translatorInstance.translate(t)));
            injectTranslation(translations, i);
        }
    } else {
        // Fallback to backend (handled via sidebar.js for the first pass usually, 
        // but we can trigger it here for dynamic content batches)
        // Note: sidebar.js currently handles the FIRST BROAD pass.
    }
    
    // 3. Start observing for new content
    if (translationObserver) translationObserver.disconnect();
    
    translationObserver = new MutationObserver(async (mutations) => {
        const newNodes = [];
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                findTextNodes(node, newNodes);
            }
        }
        
        if (newNodes.length > 0) {
            console.log(`Breezely: Found ${newNodes.length} new text nodes to translate`);
            await translateBatch(newNodes);
        }
    });
    
    translationObserver.observe(document.body, { childList: true, subtree: true });
}

function stopDynamicTranslation() {
    isTranslating = false;
    if (translationObserver) {
        translationObserver.disconnect();
        translationObserver = null;
    }
    translatorInstance = null;
}

function findTextNodes(root, results = []) {
    if (!root) return results;
    
    // Skip scripts, styles, etc.
    if (root.nodeType === Node.ELEMENT_NODE) {
        const tag = root.tagName.toLowerCase();
        if (tag === 'script' || tag === 'style' || tag === 'noscript' || tag === 'iframe') return results;
    }

    if (root.nodeType === Node.TEXT_NODE) {
        const text = root.nodeValue.trim();
        if (text.length > 1 && !originalTextMap.has(root)) {
            originalTextMap.set(root, root.nodeValue);
            results.push(root);
        }
    } else {
        for (const child of root.childNodes) {
            findTextNodes(child, results);
        }
    }
    return results;
}

async function translateBatch(nodes) {
    if (!isTranslating || !currentTargetLang) return;
    
    const texts = nodes.map(n => n.nodeValue.trim());
    
    if (translatorInstance) {
        // Fast local translation
        for (let i = 0; i < nodes.length; i++) {
            try {
                const translation = await translatorInstance.translate(texts[i]);
                applyTranslationToNode(nodes[i], translation);
            } catch (e) {
                console.error("Local translation error:", e);
            }
        }
    } else {
        // Remote translation through backend
        // We batch these to avoid hitting the backend too frequently
        try {
            chrome.runtime.sendMessage({
                type: "TRANSLATE_BATCH_REQUEST",
                texts: texts,
                targetLang: currentTargetLang
            }, (response) => {
                if (response && response.translations) {
                    for (let i = 0; i < nodes.length; i++) {
                        applyTranslationToNode(nodes[i], response.translations[i]);
                    }
                }
            });
        } catch (e) {
            console.warn("Runtime message failed (likely extension reload):", e);
        }
    }
}

function applyTranslationToNode(node, translation) {
    if (!node || !translation) return;
    const originalText = originalTextMap.get(node) || node.nodeValue;
    const leadingSpace = originalText.match(/^\s*/)[0];
    const trailingSpace = originalText.match(/\s*$/)[0];
    node.nodeValue = leadingSpace + translation + trailingSpace;
}

let originalTextNodes = [];

function extractTextNodes() {
    originalTextNodes = [];
    const texts = [];
    originalTextMap.clear();

    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: function (node) {
            const tag = node.parentElement ? node.parentElement.tagName.toLowerCase() : '';
            if (tag === 'script' || tag === 'style' || tag === 'noscript') return NodeFilter.FILTER_REJECT;
            if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
        }
    }, false);

    let node;
    while (node = walk.nextNode()) {
        const text = node.nodeValue.trim();
        if (text.length > 1) {
            originalTextNodes.push({ node: node, originalText: node.nodeValue });
            originalTextMap.set(node, node.nodeValue);
            texts.push(text);
        }
    }

    // Limit to avoid payload crashes for remote translation
    const MAX_NODES = 1000;
    if (texts.length > MAX_NODES) {
        originalTextNodes = originalTextNodes.slice(0, MAX_NODES);
        return texts.slice(0, MAX_NODES);
    }
    return texts;
}

function injectTranslation(translatedTexts, offset = 0) {
    if (!translatedTexts || !Array.isArray(translatedTexts)) return;

    for (let i = 0; i < translatedTexts.length; i++) {
        const nodeIndex = i + offset;
        if (nodeIndex >= originalTextNodes.length) break;
        
        const { node, originalText } = originalTextNodes[nodeIndex];
        const translation = translatedTexts[i];

        const leadingSpace = originalText.match(/^\s*/)[0];
        const trailingSpace = originalText.match(/\s*$/)[0];

        node.nodeValue = leadingSpace + translation + trailingSpace;
    }
}

function revertTranslation() {
    stopDynamicTranslation();
    originalTextMap.forEach((originalText, node) => {
        if (node) {
            node.nodeValue = originalText;
        }
    });
    originalTextMap.clear();
}
