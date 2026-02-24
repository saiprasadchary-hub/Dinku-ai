// chat.js - Updated for "The Imagined Void" Overhaul & Multi-version Regeneration
import { canvas, ctx, mouse } from './effects/CanvasState.js';
import { Particle as PadelsParticle } from './effects/Padels.js';
import { Wave } from './effects/Waves.js';
import { WaterSimulation } from './effects/Water.js';
import { Star, SolarSystem, SpiralGalaxy } from './effects/Galaxy.js';
import { SingularityParticle, SingularityCore } from './effects/Singularity.js';
import { Aurora } from './effects/Aurora.js';
import { Firefly } from './effects/Fireflies.js';
import { AntigravityChunk } from './effects/Antigravity.js';
import { Nebula } from './effects/Nebula.js';
import { Matrix } from './effects/Matrix.js';
import { Prism } from './effects/Prism.js';
import { CyberStorm } from './effects/cyberstorm.js?v=1.4.0';
import { ZeroGravityObject } from './effects/ZeroGravity.js';

const chatArea = document.getElementById('chat-stream') || document.getElementById('chat-area');
const promptInput = document.getElementById('prompt-input');
const sendBtn = document.getElementById('send-btn');
const charAvatar = document.getElementById('char-avatar');
const charNameEl = document.getElementById('char-name');
const welcomeCharName = document.getElementById('welcome-char-name');
const clearChatBtn = document.getElementById('clear-history-btn'); // ID updated from 'clear-chat'
const welcomeMsg = document.getElementById('welcome-msg');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = themeToggle ? themeToggle.querySelector('span') : null;

// --- FILE ATTACHMENT & WEB SEARCH STATE ---
const fileUploadInput = document.getElementById('file-upload');
const attachFileBtn = document.getElementById('attach-file-btn');
const filePreviewContainer = document.getElementById('file-preview-container');

const imageUploadInput = document.getElementById('image-upload');
const attachImageBtn = document.getElementById('attach-image-btn');
const imagePreviewContainer = document.getElementById('image-preview-container');

const webSearchBtn = document.getElementById('web-search-btn');

let attachedFiles = []; // Array of objects: { name: string, content: string }
let attachedImages = []; // Array of Base64 strings: [ "data:image/...", ... ]
let isWebSearchEnabled = false;

// Smart Scrolling State
let isUserAtBottom = true;
chatArea?.addEventListener('scroll', () => {
    const threshold = 150;
    isUserAtBottom = chatArea.scrollHeight - chatArea.scrollTop - chatArea.clientHeight < threshold;
});

function scrollToBottom(behavior = 'auto') {
    if (isUserAtBottom || behavior === 'smooth') {
        chatArea.scrollTo({ top: chatArea.scrollHeight, behavior });
    }
}

// 0. Global State & DOM Reference Audit
// (Modals are fetched dynamically where needed to avoid early-initialization null pointers)

// Listen for New Chat from Sidebar
window.addEventListener('new-chat-requested', async (e) => {
    const skipConfirm = e.detail && e.detail.skipConfirm;

    const confirmed = skipConfirm || await window.dinkuConfirm(
        'Start New Chat?',
        'This will clear your current conversation and start a fresh session.',
        'New Chat',
        false
    );

    if (confirmed) {
        chatHistory = [];
        currentSessionId = 'session_' + Date.now();
        localStorage.setItem('dinku_current_session_id', currentSessionId);
        if (welcomeMsg) {
            welcomeMsg.classList.remove('hidden');
            welcomeMsg.style.display = 'flex';
        }
        renderHistory();
        // Notify sidebar that we have a new empty session
        updateSessionsList();
    }
});

// Username elements
const userNameBtn = document.getElementById('user-name-btn');
const displayUserName = document.getElementById('display-user-name');
const usernameModal = document.getElementById('username-modal');
const usernameInput = document.getElementById('username-input');
const saveUsernameBtn = document.getElementById('save-username-btn');
const closeUsernameModal = document.getElementById('close-username-modal');

let currentUserName = localStorage.getItem('dinku_username') || 'anon';

let chatHistory = [];
let currentSessionId = localStorage.getItem('dinku_current_session_id') || 'session_' + Date.now();

const defaultPersona = {
    name: "Dinku AI",
    systemPrompt: "You are Dinku AI, a highly intelligent and helpful Large Language Model assistant. Your goal is to provide accurate, clear, and direct answers to user queries. You are part of 'The Imagined Void' and you act with precision and professionalism. You should identify as an AI assistant when asked and focus on providing high-quality information and assistance.",
    avatar: null
};
let customPersona = defaultPersona;
const DEFAULT_REMOTE_URL = "https://kspchary-vibe-coding-backend.hf.space";
const LOCAL_URL = "http://localhost:7860";

// Determine which URL to use
let API_BASE_URL = DEFAULT_REMOTE_URL;

// Auto-switch to local if on localhost or if remote is known to be down
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    API_BASE_URL = LOCAL_URL;
    console.log("Dinku Chat: Running on localhost, using local backend:", API_BASE_URL);
}


// Auto-switch to local if on localhost or if remote is known to be down
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    API_BASE_URL = LOCAL_URL;
    console.log("Dinku Chat: Running on localhost, using local backend:", API_BASE_URL);
}

// --- INITIALIZE UI STATE ---

// 1. Initialize UI State
function initChatState() {
    if (charNameEl) charNameEl.textContent = "Dinku AI";
    if (welcomeCharName) welcomeCharName.textContent = "Dinku AI";

    if (charAvatar) {
        charAvatar.innerHTML = `<span class="material-symbols-outlined star-icon">nova_cutout</span>`;
    }

    const cUser = localStorage.getItem('dinku_username') || 'User';
    const sidebarUserName = document.getElementById('sidebar-user-name');
    const sidebarUserAvatar = document.getElementById('sidebar-user-avatar');

    if (sidebarUserName) sidebarUserName.textContent = cUser;
    if (sidebarUserAvatar) sidebarUserAvatar.textContent = cUser.charAt(0).toUpperCase();

    // Migration for legacy session
    if (!localStorage.getItem(`dinku_chat_session_${currentSessionId}`)) {
        const legacySession = localStorage.getItem('dinku_chat_session_default');
        if (legacySession) {
            localStorage.setItem(`dinku_chat_session_${currentSessionId}`, legacySession);
            localStorage.removeItem('dinku_chat_session_default');
        }
    }

    // Load session history
    const savedSession = localStorage.getItem(`dinku_chat_session_${currentSessionId}`);

    if (savedSession) {
        try {
            chatHistory = JSON.parse(savedSession);
            chatHistory = chatHistory.map(m => {
                if (m.sender === 'ai' && m.text && !m.versions) {
                    return { ...m, versions: [m.text], activeVersion: 0 };
                }
                return m;
            });
            renderHistory();
        } catch (e) {
            console.error("Failed to parse session history", e);
            chatHistory = [];
        }
    } else {
        chatHistory = [];
        renderHistory();
    }

    // Notify sidebar of initial state
    updateSessionsList();

    // Theme Initialization
    const savedTheme = localStorage.getItem('dinku_theme') || localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
    }
}

// --- PERSONA DROPDOWN & MODAL LOGIC ---
function updateSendButtonState() {
    if (promptInput.value.trim().length > 0 || attachedFiles.length > 0 || attachedImages.length > 0) {
        sendBtn.classList.add('ready');
    } else {
        sendBtn.classList.remove('ready');
    }
}



// 1.1 Chat History Formatter for AI
function getHistoryForAI(limit = 15) {
    // Map chatHistory to the format expected by the backend
    return chatHistory.slice(-limit).map(msg => {
        if (msg.sender === 'user') {
            return { role: 'user', content: msg.text };
        } else {
            // Use current version for AI messages
            const content = msg.versions ? msg.versions[msg.activeVersion] : (msg.text || "");
            return { role: 'assistant', content: content };
        }
    });
}

// 2. Markdown Parser Enhanced for Code Previews (Supports partial blocks for streaming)
function parseMarkdown(text) {
    if (!text) return "";

    const codeBlocks = [];
    // 1. Extract fenced code blocks and replace with placeholders
    // Detects both complete ```lang\ncode``` and partial ```lang\ncode (streaming)
    let processedText = text.replace(/```(\w+)?\n([\s\S]*?)($|```)/g, (match, lang, code, end) => {
        const index = codeBlocks.length;
        const language = (lang || 'code').toLowerCase();
        const isComplete = end === '```';

        // Check if language is previewable
        const isPreviewable = ['html', 'css', 'js', 'javascript'].includes(language);
        let previewBtn = '';
        let generatingLabel = '';

        if (isComplete && isPreviewable) {
            previewBtn = `<button class="code-btn preview-code-btn" data-lang="${language}">
                <span class="material-symbols-outlined">visibility</span> Preview
            </button>`;
        } else if (!isComplete) {
            generatingLabel = `<span class="generating-label">Generating...</span>`;
        }

        const escapedCode = code.replace(/</g, "&lt;").replace(/>/g, "&gt;");

        codeBlocks.push(`
            <div class="code-block ${!isComplete ? 'is-generating' : ''}" data-lang="${language}">
                <div class="code-header">
                    <span class="code-lang">${language}</span>
                    <div class="code-actions">
                        ${generatingLabel}
                        ${previewBtn}
                        <button class="code-btn copy-code-btn">
                            <span class="material-symbols-outlined">content_copy</span> Copy
                        </button>
                    </div>
                </div>
                <pre><code>${escapedCode}</code></pre>
            </div>
        `);
        return `__CODE_BLOCK_${index}__`;
    });

    // 2. Handle other markdown elements on the remaining text
    processedText = processedText
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/gim, '<span class="action-text">*$1*</span>')
        .replace(/`([^`]+)`/g, '<code>$1</code>') // Inline code
        .replace(/\n/g, '<br>');

    // 3. Restore code blocks from placeholders
    codeBlocks.forEach((block, index) => {
        processedText = processedText.replace(`__CODE_BLOCK_${index}__`, block);
    });

    return processedText;
}

// 2.1 Live Preview Engine
function openLivePreview(code, lang) {
    const previewModal = document.getElementById('preview-modal');
    const previewFrame = document.getElementById('preview-frame');
    const topPreviewBtn = document.getElementById('top-preview-btn');

    if (!previewModal || !previewFrame) {
        console.error("Preview elements not found:", { previewModal, previewFrame });
        return;
    }

    let finalHtml = "";
    if (lang === 'html') {
        finalHtml = code;
    } else if (lang === 'css') {
        finalHtml = `<!DOCTYPE html><html><head><style>${code}</style></head><body><div style="padding:20px; font-family:sans-serif;"><h3>CSS Preview</h3><p>Styling applied to the document body.</p></div></body></html>`;
    } else if (lang === 'js' || lang === 'javascript') {
        const safeCode = code.replace(/<\/script>/gi, '<\\/script>');
        finalHtml = `
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"><style>body{font-family:sans-serif; padding:20px; color:#333;}</style></head>
            <body>
                <div id="status"><h3>JavaScript Preview</h3><p>Executing code...</p></div>
                <script>${safeCode}</script>
            </body>
            </html>
        `;
    }

    // Wrap in standard boilerplate if missing <html> for HTML lang
    if (lang === 'html' && !code.includes('<html')) {
        finalHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>body { font-family: sans-serif; margin: 0; }</style>
            </head>
            <body>${code}</body>
            </html>
        `;
    }

    previewModal.classList.add('active');
    previewModal.style.setProperty('display', 'flex', 'important');

    // Store latest code for top-bar shortcut
    window.latestPreviewableCode = { code, lang };
    if (topPreviewBtn) topPreviewBtn.classList.remove('hidden');

    // Use srcdoc for safer/easier local rendering
    previewFrame.srcdoc = finalHtml;

    console.log("Live Preview System: Opened modal for", lang);
}

// Username Management
function initUsername() {
    if (displayUserName) displayUserName.textContent = currentUserName;
    if (usernameInput) usernameInput.value = currentUserName;

    // Auto-open modal if user hasn't set a custom name yet
    if (currentUserName === 'anon') {
        setTimeout(() => {
            if (typeof openUsernameModal === 'function') openUsernameModal();
        }, 500);
    }
}

function openUsernameModal() {
    usernameModal.style.display = 'flex';
    usernameInput.value = currentUserName;
    usernameInput.focus();
    usernameInput.select();
}

function closeUsernameModalFn() {
    usernameModal.style.display = 'none';
}

function saveUsername() {
    const newName = usernameInput.value.trim() || 'anon';
    currentUserName = newName;
    localStorage.setItem('dinku_username', newName);
    displayUserName.textContent = newName;
    closeUsernameModalFn();
}

// Event listeners for username
userNameBtn?.addEventListener('click', openUsernameModal);
closeUsernameModal?.addEventListener('click', closeUsernameModalFn);
saveUsernameBtn?.addEventListener('click', saveUsername);
usernameInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        saveUsername();
    }
});
usernameModal?.addEventListener('click', (e) => {
    if (e.target === usernameModal) {
        closeUsernameModalFn();
    }
});

// 3. Message Actions Helper
function appendAIActionButtons(messageDiv, bubble, msgObj, indexInHistory) {
    // Remove if exists
    const oldActions = messageDiv.querySelector('.message-actions');
    if (oldActions) oldActions.remove();

    const actionsDiv = document.createElement('div');
    actionsDiv.classList.add('message-actions');

    // Version Switcher
    let versionSwitcherHTML = '';
    if (msgObj.versions && msgObj.versions.length > 1) {
        versionSwitcherHTML = `
            <div class="version-switcher">
                <button class="version-btn prev-ver" ${msgObj.activeVersion === 0 ? 'disabled' : ''}>
                    <span class="material-symbols-outlined">chevron_left</span>
                </button>
                <span>${msgObj.activeVersion + 1}/${msgObj.versions.length}</span>
                <button class="version-btn next-ver" ${msgObj.activeVersion === msgObj.versions.length - 1 ? 'disabled' : ''}>
                    <span class="material-symbols-outlined">chevron_right</span>
                </button>
            </div>
        `;
    }

    const currentText = msgObj.versions[msgObj.activeVersion];

    // Check if message appears incomplete (hide Continue button if complete)
    const seemsIncomplete = currentText.match(/```[a-z]*\n[^`]*$/i) || // Unclosed code block
        currentText.trim().endsWith('...') ||
        currentText.trim().endsWith(',') ||
        currentText.trim().endsWith('{') ||
        currentText.trim().endsWith('(') ||
        currentText.trim().endsWith('[') ||
        (currentText.length > 100 && !currentText.trim().match(/[.!?}>\"\'`]$/)); // Ends without standard terminator or quote

    const continueButtonHTML = seemsIncomplete ? `
        <button class="action-tool continue-btn" title="Continue Generating">
            <span class="material-symbols-outlined">fast_forward</span>
        </button>
    ` : '';

    actionsDiv.innerHTML = `
        ${versionSwitcherHTML}
        ${continueButtonHTML}
        <button class="action-tool speak-btn" title="Speak Message">
            <span class="material-symbols-outlined">volume_up</span>
        </button>
        <button class="action-tool copy-btn" title="Copy Message">
            <span class="material-symbols-outlined">content_copy</span>
        </button>
        <button class="action-tool reg-btn" title="Regenerate">
            <span class="material-symbols-outlined">refresh</span>
        </button>
    `;

    const continueBtn = actionsDiv.querySelector('.continue-btn');
    const copyBtn = actionsDiv.querySelector('.copy-btn');
    const regBtn = actionsDiv.querySelector('.reg-btn');
    const speakBtn = actionsDiv.querySelector('.speak-btn');
    const prevBtn = actionsDiv.querySelector('.prev-ver');
    const nextBtn = actionsDiv.querySelector('.next-ver');

    if (continueBtn) {
        continueBtn.onclick = () => continueGeneration(indexInHistory, messageDiv, bubble);
    }

    copyBtn.onclick = () => {
        navigator.clipboard.writeText(currentText);
        copyBtn.innerHTML = '<span class="material-symbols-outlined">check</span>';
        setTimeout(() => copyBtn.innerHTML = '<span class="material-symbols-outlined">content_copy</span>', 2000);
    };

    regBtn.onclick = () => regenerateMessage(indexInHistory, messageDiv, bubble);

    speakBtn.onclick = () => speakText(currentText, speakBtn);

    if (prevBtn) {
        prevBtn.onclick = () => {
            msgObj.activeVersion = Math.max(0, msgObj.activeVersion - 1);
            bubble.innerHTML = parseMarkdown(msgObj.versions[msgObj.activeVersion]);
            appendAIActionButtons(messageDiv, bubble, msgObj, indexInHistory);
            saveSession();
        };
    }

    if (nextBtn) {
        nextBtn.onclick = () => {
            msgObj.activeVersion = Math.min(msgObj.versions.length - 1, msgObj.activeVersion + 1);
            bubble.innerHTML = parseMarkdown(msgObj.versions[msgObj.activeVersion]);
            appendAIActionButtons(messageDiv, bubble, msgObj, indexInHistory);
            saveSession();
        };
    }

    const timeEl = messageDiv.querySelector('.msg-time');
    if (timeEl) {
        messageDiv.insertBefore(actionsDiv, timeEl);
    } else {
        messageDiv.appendChild(actionsDiv);
    }
}

// 3.1 Speech Synthesis (Text to Speech)
function speakText(text, btn) {
    if (!('speechSynthesis' in window)) return;

    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        if (btn) btn.innerHTML = '<span class="material-symbols-outlined">volume_up</span>';
        return;
    }

    const cleanText = text.replace(/```[\s\S]*?```/g, ' [Code Block] ')
        .replace(/[*#`]/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    const savedVoiceName = localStorage.getItem('dinku_voice');

    if (savedVoiceName) {
        const voice = voices.find(v => v.name === savedVoiceName);
        if (voice) utterance.voice = voice;
    } else if (voices.length > 0) {
        const preferred = voices.find(v => v.name.includes('Google') || v.name.includes('Natural'));
        if (preferred) utterance.voice = preferred;
    }

    utterance.onstart = () => { if (btn) btn.innerHTML = '<span class="material-symbols-outlined">stop_circle</span>'; };
    utterance.onend = () => { if (btn) btn.innerHTML = '<span class="material-symbols-outlined">volume_up</span>'; };
    window.speechSynthesis.speak(utterance);
}

// 3.2 Voice Features Initialization
function initVoiceFeatures() {
    const micBtn = document.getElementById('mic-btn');
    const voiceSelect = document.getElementById('voice-select');

    // 1. Populate Voices
    function populateVoices() {
        if (!voiceSelect || !('speechSynthesis' in window)) return;
        const voices = window.speechSynthesis.getVoices();
        voiceSelect.innerHTML = '<option value="">Default Voice</option>';
        voices.forEach(voice => {
            const opt = document.createElement('option');
            opt.value = voice.name;
            opt.textContent = `${voice.name} (${voice.lang})`;
            voiceSelect.appendChild(opt);
        });
        const savedVoice = localStorage.getItem('dinku_voice');
        if (savedVoice) voiceSelect.value = savedVoice;
    }

    if (voiceSelect) {
        populateVoices();
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = populateVoices;
        }
        voiceSelect.addEventListener('change', (e) => {
            localStorage.setItem('dinku_voice', e.target.value);
        });
    }

    // 2. Mic Logic
    if (!micBtn) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        micBtn.style.display = 'none';
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let isListening = false;

    micBtn.addEventListener('click', () => {
        if (isListening) {
            recognition.stop();
        } else {
            try {
                recognition.start();
            } catch (e) { console.error(e); }
        }
    });

    recognition.onstart = () => {
        isListening = true;
        micBtn.classList.add('listening');
        micBtn.style.color = '#ff5546';
        micBtn.innerHTML = 'graphic_eq';
        promptInput.placeholder = "Listening...";
    };

    recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');

        promptInput.value = transcript;
        promptInput.style.height = 'auto';
        promptInput.style.height = promptInput.scrollHeight + 'px';
    };

    recognition.onend = () => {
        isListening = false;
        micBtn.classList.remove('listening');
        micBtn.style.color = '';
        micBtn.innerHTML = 'mic';
        promptInput.placeholder = "Enter a prompt here";
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        recognition.stop();
    };
}

async function continueGeneration(historyIndex, messageDiv, bubble) {
    const aiMsg = chatHistory[historyIndex];
    let currentContent = aiMsg.versions[aiMsg.activeVersion];

    // Remove old actions while generating
    const oldActions = messageDiv.querySelector('.message-actions');
    if (oldActions) oldActions.remove();

    // Context for continuation (last 2000 chars)
    const context = currentContent.slice(-2000);

    // Create continuation prompt
    const continuationPrompt = `[SYSTEM: The user wants you to continue the previous response exactly where it stopped. Do not repeat the context. Just continue the code or text immediately.]\n\n[CONTEXT_START]...${context}[CONTEXT_END]\n\n[CONTINUE]`;

    try {
        const history = getHistoryForAI(historyIndex);
        const response = await fetch(`${API_BASE_URL}/vibe`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                prompt: continuationPrompt,
                history: history,
                sessionId: currentSessionId
            })
        });

        if (response.status !== 200) throw new Error("Failed to continue generation");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let lastUpdateTime = 0;
        const MIN_TIME_BETWEEN_UPDATES = 100;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");
            for (const line of lines) {
                if (line.startsWith("data:")) {
                    const dataStr = line.replace("data:", "").trim();
                    if (dataStr === "[DONE]") break;
                    try {
                        const json = JSON.parse(dataStr);
                        const token = json.token || "";
                        currentContent += token;

                        // Throttled Update
                        const now = Date.now();
                        if (now - lastUpdateTime > MIN_TIME_BETWEEN_UPDATES) {
                            bubble.innerHTML = parseMarkdown(currentContent);
                            scrollToBottom('auto');
                            lastUpdateTime = now;
                        }
                    } catch (e) { }
                }
            }
        }

        // Final Update
        bubble.innerHTML = parseMarkdown(currentContent);
        scrollToBottom('smooth');

        // Update history
        aiMsg.versions[aiMsg.activeVersion] = currentContent;
        saveSession();
        appendAIActionButtons(messageDiv, bubble, aiMsg, historyIndex);

        // Auto-read if enabled
        if (localStorage.getItem('dinku_auto_read') === 'true') {
            speakText(currentContent);
        }
    } catch (error) {
        console.error("Continue Error:", error);
        alert("Failed to continue generation. Please try again.");
        appendAIActionButtons(messageDiv, bubble, aiMsg, historyIndex);
    }
}

// --- FILE & IMAGE HANDLING LOGIC ---
if (attachFileBtn && fileUploadInput) {
    attachFileBtn.addEventListener('click', () => {
        fileUploadInput.click();
    });
}

if (attachImageBtn && imageUploadInput) {
    attachImageBtn.addEventListener('click', () => {
        imageUploadInput.click();
    });
}

if (fileUploadInput) {
    fileUploadInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Process up to 5 files at a time to prevent overflow
        const newFiles = files.slice(0, 5 - attachedFiles.length);

        for (const file of newFiles) {
            // Basic validation for text-like files (HTML, JS, TXT, PY, JSON, CSS, MD, CSV)
            if (file.size > 5 * 1024 * 1024) {
                alert(`File ${file.name} is too large (max 5MB).`);
                continue;
            }

            try {
                const text = await file.text();
                attachedFiles.push({
                    name: file.name,
                    content: text
                });
            } catch (err) {
                console.error("Failed to read file", file.name, err);
                alert(`Failed to read ${file.name}`);
            }
        }

        renderFileBadges();
        fileUploadInput.value = ''; // Reset input
    });
}

function renderFileBadges() {
    if (!filePreviewContainer) return;

    filePreviewContainer.innerHTML = '';

    attachedFiles.forEach((file, index) => {
        const badge = document.createElement('div');
        badge.classList.add('file-badge');
        badge.innerHTML = `
            <span class="material-symbols-outlined">description</span>
            ${file.name}
            <span class="material-symbols-outlined remove-file" data-index="${index}">close</span>
        `;
        filePreviewContainer.appendChild(badge);
    });

    // Attach remove listeners
    filePreviewContainer.querySelectorAll('.remove-file').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.getAttribute('data-index'), 10);
            attachedFiles.splice(index, 1);
            renderFileBadges();
        });
    });

    updateSendButtonState();
}

if (imageUploadInput) {
    imageUploadInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Limit to 3 images max
        const newImages = files.slice(0, 3 - attachedImages.length);

        newImages.forEach(file => {
            if (file.size > 10 * 1024 * 1024) {
                alert(`Image ${file.name} is too large (max 10MB).`);
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                attachedImages.push(event.target.result);
                renderImageBadges();
            };
            reader.onerror = () => {
                console.error("Failed to read image", file.name);
                alert(`Failed to read ${file.name}`);
            };
            reader.readAsDataURL(file);
        });

        imageUploadInput.value = ''; // Reset input
    });
}

function renderImageBadges() {
    if (!imagePreviewContainer) return;
    imagePreviewContainer.innerHTML = '';
    attachedImages.forEach((imgSrc, index) => {
        const badge = document.createElement('div');
        badge.classList.add('image-badge');
        badge.innerHTML = `
            <img src="${imgSrc}" alt="Attached Image ${index + 1}" />
            <span class="material-symbols-outlined remove-image" data-index="${index}">close</span>
        `;
        imagePreviewContainer.appendChild(badge);
    });

    imagePreviewContainer.querySelectorAll('.remove-image').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.getAttribute('data-index'), 10);
            attachedImages.splice(index, 1);
            renderImageBadges();
        });
    });

    updateSendButtonState();
}

// --- WEB SEARCH LOGIC ---
if (webSearchBtn) {
    webSearchBtn.addEventListener('click', () => {
        isWebSearchEnabled = !isWebSearchEnabled;
        webSearchBtn.classList.toggle('active', isWebSearchEnabled);

        if (isWebSearchEnabled) {
            webSearchBtn.innerHTML = 'travel_explore';
            webSearchBtn.title = 'Web Search Enabled';
        } else {
            webSearchBtn.innerHTML = 'public';
            webSearchBtn.title = 'Toggle Web Search';
        }
    });
}

// 4. Message Rendering
function addMessage(text, sender) {
    if (welcomeMsg && !welcomeMsg.classList.contains('hidden')) {
        welcomeMsg.classList.add('hidden');
        // Keep it in DOM but hidden to avoid layout jumps
        setTimeout(() => { if (welcomeMsg) welcomeMsg.style.display = 'none'; }, 500);
    }

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);

    const bubble = document.createElement('div');
    bubble.classList.add('bubble');

    const time = document.createElement('div');
    time.classList.add('msg-time');
    time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (sender === 'ai') {
        bubble.innerHTML = parseMarkdown(text);
        messageDiv.appendChild(bubble); // AI: Header (none), Bubble, Time
        messageDiv.appendChild(time);
    } else {
        // User: Header (Name), Bubble, Time
        const userHeader = document.createElement('div');
        userHeader.classList.add('message-header');
        userHeader.innerHTML = `<span class="user-label">${currentUserName}</span>`;
        messageDiv.appendChild(userHeader);

        bubble.textContent = text;
        messageDiv.appendChild(bubble);
        messageDiv.appendChild(time);
    }

    chatArea.appendChild(messageDiv);
    isUserAtBottom = true;
    scrollToBottom('smooth');

    if (sender === 'user') {
        chatHistory.push({ text, sender, timestamp: Date.now(), userName: currentUserName });
        saveSession();
    }

    return { bubble, messageDiv };
}

function renderHistory() {
    // Save current scroll position or just scroll to bottom at end
    chatArea.innerHTML = '';

    // Ensure welcomeMsg is correctly handled
    if (welcomeMsg) {
        welcomeMsg.classList.remove('hidden');
        welcomeMsg.style.display = 'flex';
        chatArea.appendChild(welcomeMsg);
    }

    chatHistory.forEach((msg, index) => {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', msg.sender);

        const bubble = document.createElement('div');
        bubble.classList.add('bubble');

        const content = msg.sender === 'ai' ? msg.versions[msg.activeVersion] : msg.text;

        const time = document.createElement('div');
        time.classList.add('msg-time');
        const d = new Date(msg.timestamp);
        time.textContent = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (msg.sender === 'ai') {
            bubble.innerHTML = parseMarkdown(content);
            messageDiv.appendChild(bubble);
            appendAIActionButtons(messageDiv, bubble, msg, index);
            messageDiv.appendChild(time);
        } else {
            const userName = msg.userName || currentUserName || 'anon';
            const userHeader = document.createElement('div');
            userHeader.classList.add('message-header');
            userHeader.innerHTML = `<span class="user-label">${userName}</span>`;
            messageDiv.appendChild(userHeader);

            bubble.textContent = content;
            messageDiv.appendChild(bubble);
            messageDiv.appendChild(time);
        }
        chatArea.appendChild(messageDiv);
    });
    scrollToBottom('auto');
}

// 5. In-place Regeneration Logic
async function regenerateMessage(historyIndex, messageDiv, bubble) {
    let promptText = "";
    for (let i = historyIndex - 1; i >= 0; i--) {
        if (chatHistory[i].sender === 'user') {
            promptText = chatHistory[i].text;
            break;
        }
    }
    if (!promptText) return;

    bubble.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;

    try {
        // 5. User Prep & Context Building
        const modelName = localStorage.getItem('dinku_model') === 'dinku-ultra' ? 'Dinku Ultra' : 'Dinku Pro';
        const responseStyle = localStorage.getItem('dinku_response_style') || 'balanced';
        const userCustomInstruction = localStorage.getItem('dinku_custom_instructions') || '';

        let stylePrompt = "";
        if (responseStyle === 'concise') stylePrompt = "Be extremely concise, direct, and brief. No fluff.";
        if (responseStyle === 'detailed') stylePrompt = "Be highly detailed, thorough, and explain everything in depth.";

        // Read Active Persona
        const activePersona = getActivePersona();

        // Build File Context
        let fileContextStr = "";
        if (attachedFiles.length > 0) {
            fileContextStr = "\n\n[ATTACHED FILES CONTEXT]\nThe user has provided the following file(s) for context. Read them carefully before answering:\n";
            attachedFiles.forEach(f => {
                fileContextStr += `\n--- START FILE: ${f.name} ---\n${f.content}\n--- END FILE: ${f.name} ---\n`;
            });
        }

        // Web Search Context
        let webSearchStr = "";
        if (isWebSearchEnabled) {
            webSearchStr = "\n\n[SYSTEM DIRECTIVE]: 🌐 The user has requested up-to-date information. If necessary to answer accurately, you must utilize your web search capabilities or provide the most recent knowledge you have.";
        }

        const systemInstruction = `
[SYSTEM CONTEXT]
> Model: ${modelName}
> Style: ${responseStyle}. ${stylePrompt}
> Custom Global Instructions: ${userCustomInstruction ? userCustomInstruction : "None"}

[BEHAVIORAL RULES]
1. You MUST act exactly as defined below in [PERSONA PROFILE].
2. You MUST prioritize and accurately parse the information provided in [ATTACHED FILES CONTEXT] and [WEB SEARCH DIRECTIVE] if they exist.
3. Be helpful, polite, and technically precise.
4. Format responses cleanly using Markdown.
5. [USER CONTEXT] The person you are talking to is: ${currentUserName}.
${webSearchStr}
`;
        // Build the definitive prompt payload ensuring strict separation of instructions and user input
        const fullPrompt = `${systemInstruction}\n\n[PERSONA PROFILE]\n${activePersona.systemPrompt}${fileContextStr}\n\n[USER QUERY]\n${promptText}\n[END USER QUERY]\n\nAI:`;

        const history = getHistoryForAI(historyIndex);

        // Clear attachments after sending
        if (attachedFiles.length > 0) {
            attachedFiles = [];
            renderFileBadges();
        }

        const payloadImages = [...attachedImages]; // Copy to pass into fetch
        if (attachedImages.length > 0) {
            attachedImages = [];
            renderImageBadges();
        }

        const response = await fetch(`${API_BASE_URL}/vibe`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                prompt: fullPrompt,
                history: history,
                sessionId: currentSessionId,
                images: payloadImages.length > 0 ? payloadImages : undefined
            })
        });

        if (response.status === 429) {
            const errJson = await response.json();
            throw new Error(errJson.error || "Rate limit reached");
        }
        if (!response.ok) throw new Error("Offline");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let finalText = "";
        bubble.innerHTML = "";

        let lastUpdateTime = 0;
        const MIN_TIME_BETWEEN_UPDATES = 100; // ms throttle

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");
            for (const line of lines) {
                if (line.startsWith("data:")) {
                    const dataStr = line.replace("data:", "").trim();
                    if (dataStr === "[DONE]") break;
                    try {
                        const json = JSON.parse(dataStr);
                        finalText += json.token || "";

                        // Throttled Update
                        const now = Date.now();
                        if (now - lastUpdateTime > MIN_TIME_BETWEEN_UPDATES) {
                            bubble.innerHTML = parseMarkdown(finalText);
                            scrollToBottom('auto');
                            lastUpdateTime = now;
                        }
                    } catch (e) { }
                }
            }
        }

        // Final update
        bubble.innerHTML = parseMarkdown(finalText);
        scrollToBottom('smooth');

        const aiMsg = chatHistory[historyIndex];
        aiMsg.versions.push(finalText);
        aiMsg.activeVersion = aiMsg.versions.length - 1;

        appendAIActionButtons(messageDiv, bubble, aiMsg, historyIndex);
        saveSession();

        // Auto-read if enabled
        if (localStorage.getItem('dinku_auto_read') === 'true') {
            speakText(finalText);
        }

    } catch (error) {
        console.error("Regeneration Error:", error);
        bubble.innerHTML = `
            <div class="error-msg">
                <span class="material-symbols-outlined">error</span>
                Regeneration failed. ${error.message === 'Offline' ? 'Server is unreachable.' : error.message}
                <br>
                <small>Try starting the local backend in the /LLM folder.</small>
            </div>
        `;
    }
}

// 6. API Logic for New Messages
async function sendMessage() {
    const text = promptInput.value.trim();
    if (!text && attachedFiles.length === 0 && attachedImages.length === 0) return;

    promptInput.value = '';
    promptInput.style.height = 'auto';
    updateSendButtonState(); // Rest status instantly

    addMessage(text || '[Sent Attachment]', 'user');

    const indicator = document.createElement('div');
    indicator.classList.add('message', 'ai', 'indicator-container');
    indicator.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
    chatArea.appendChild(indicator);
    isUserAtBottom = true;
    scrollToBottom('smooth');

    try {
        // User Prep & Context Building
        const modelName = localStorage.getItem('dinku_model') === 'dinku-ultra' ? 'Dinku Ultra' : 'Dinku Pro';
        const responseStyle = localStorage.getItem('dinku_response_style') || 'balanced';
        const userCustomInstruction = localStorage.getItem('dinku_custom_instructions') || '';

        let stylePrompt = "";
        if (responseStyle === 'concise') stylePrompt = "Be extremely concise, direct, and brief. No fluff.";
        if (responseStyle === 'detailed') stylePrompt = "Be highly detailed, thorough, and explain everything in depth.";

        // Active Persona is now default Dinku AI
        const activePersona = defaultPersona;

        // Build File Context
        let fileContextStr = "";
        if (attachedFiles.length > 0) {
            fileContextStr = "\n\n[ATTACHED FILES CONTEXT]\nThe user has provided the following file(s) for context. Read them carefully before answering:\n";
            attachedFiles.forEach(f => {
                fileContextStr += `\n--- START FILE: ${f.name} ---\n${f.content}\n--- END FILE: ${f.name} ---\n`;
            });
        }

        // Web Search Context
        let webSearchStr = "";
        if (isWebSearchEnabled) {
            webSearchStr = "\n\n[WEB SEARCH DIRECTIVE]: 🌐 The user has requested up-to-date information. If necessary to answer accurately, you must utilize your web search capabilities or provide the most recent knowledge you have.";
        }

        const systemInstruction = `
[SYSTEM CONTEXT]
> Model: ${modelName}
> Style: ${responseStyle}. ${stylePrompt}
> Custom Global Instructions: ${userCustomInstruction ? userCustomInstruction : "None"}

[BEHAVIORAL RULES]
1. You MUST act exactly as defined below in [PERSONA PROFILE].
2. You MUST prioritize and accurately parse the information provided in [ATTACHED FILES CONTEXT] and [WEB SEARCH DIRECTIVE] if they exist.
3. Be helpful, polite, and technically precise.
4. Format responses cleanly using Markdown.
5. [USER CONTEXT] The person you are talking to is: ${currentUserName}.
${webSearchStr}
`;
        // Build the definitive prompt payload
        const fullPrompt = `${systemInstruction}\n\n[PERSONA PROFILE]\n${activePersona.systemPrompt}${fileContextStr}\n\n[USER QUERY]\n${text}\n[END USER QUERY]\n\nAI:`;

        const history = getHistoryForAI(15);

        // Clear attachments after sending
        if (attachedFiles.length > 0) {
            attachedFiles = [];
            renderFileBadges();
        }

        const payloadImages = [...attachedImages]; // Copy to pass into fetch
        if (attachedImages.length > 0) {
            attachedImages = [];
            renderImageBadges();
        }

        const response = await fetch(`${API_BASE_URL}/vibe`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                prompt: fullPrompt,
                history: history,
                sessionId: currentSessionId,
                images: payloadImages.length > 0 ? payloadImages : undefined
            })
        });

        if (response.status === 429) {
            const errJson = await response.json();
            const errBubble = document.createElement('div');
            errBubble.classList.add('message', 'ai');
            errBubble.innerHTML = `
                <div class="error-msg">
                    <span class="material-symbols-outlined">bolt</span>
                    ${errJson.error}
                </div>
            `;
            indicator.remove();
            chatArea.appendChild(errBubble);
            return;
        }

        indicator.remove();
        const { bubble, messageDiv } = addMessage('', 'ai');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let finalText = "";

        let lastUpdateTime = 0;
        const MIN_TIME_BETWEEN_UPDATES = 100; // ms throttle for smoother rendering

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");
            for (const line of lines) {
                if (line.startsWith("data:")) {
                    const dataStr = line.replace("data:", "").trim();
                    if (dataStr === "[DONE]") break;
                    try {
                        const json = JSON.parse(dataStr);
                        finalText += json.token || "";

                        // Throttled Update
                        const now = Date.now();
                        if (now - lastUpdateTime > MIN_TIME_BETWEEN_UPDATES) {
                            bubble.innerHTML = parseMarkdown(finalText);
                            // Use 'auto' behavior for streaming to prevent "fighting" the scroll
                            scrollToBottom('auto');
                            lastUpdateTime = now;
                        }
                    } catch (e) { }
                }
            }
        }

        // Final update to ensure completion
        bubble.innerHTML = parseMarkdown(finalText);
        scrollToBottom('smooth');

        const aiMsgObj = { versions: [finalText], activeVersion: 0, sender: 'ai', timestamp: Date.now() };
        chatHistory.push(aiMsgObj);
        appendAIActionButtons(messageDiv, bubble, aiMsgObj, chatHistory.length - 1);
        saveSession();

        // 6.1 Auto-read if enabled
        const autoRead = localStorage.getItem('dinku_auto_read') === 'true';
        if (autoRead) {
            const speakBtn = messageDiv.querySelector('.speak-btn');
            speakText(finalText, speakBtn);
        }

        // 7. Auto-detect latest previewable code after finish
        const blocks = finalText.match(/```(html|css|js|javascript)\n([\s\S]*?)```/gi);
        if (blocks) {
            const lastBlock = blocks[blocks.length - 1];
            const match = lastBlock.match(/```(html|css|js|javascript)\n([\s\S]*?)```/i);
            if (match) {
                window.latestPreviewableCode = { lang: match[1].toLowerCase(), code: match[2].trim() };
                const topPreviewBtn = document.getElementById('top-preview-btn');
                if (topPreviewBtn) topPreviewBtn.classList.remove('hidden');
            }
        }

    } catch (error) {
        console.error("Chat Error:", error);
        indicator.remove();
        addMessage(`
            <div class="error-msg">
                <span class="material-symbols-outlined">cloud_off</span>
                Connection lost or server unreachable.
                <br>
                <small>If you're running locally, ensure the <code>node LLM/server.js</code> is active.</small>
            </div>
        `, 'ai');
    }
}

// 9. Utilities & Initialization
// --- ACTIVITY LOG SYSTEM ---
let activityGlobalLog = [];

function loadActivityLog() {
    const saved = localStorage.getItem('dinku_activity_log');
    if (saved) {
        try {
            activityGlobalLog = JSON.parse(saved);
        } catch (e) {
            activityGlobalLog = [];
        }
    } else {
        activityGlobalLog = [];
    }
}

function saveActivityLog() {
    // Keep only the 50 most recent events to prevent unlimited growth
    if (activityGlobalLog.length > 50) {
        activityGlobalLog = activityGlobalLog.slice(0, 50);
    }
    localStorage.setItem('dinku_activity_log', JSON.stringify(activityGlobalLog));
}

function logActivity(actionName, details, icon = 'info') {
    const event = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        action: actionName,
        details: details,
        icon: icon
    };

    // Add to beginning of array
    activityGlobalLog.unshift(event);
    saveActivityLog();

    // Auto-update if modal is open
    renderActivityLog();
}

function renderActivityLog() {
    const listContainer = document.getElementById('activity-list');
    if (!listContainer) return;

    if (activityGlobalLog.length === 0) {
        listContainer.innerHTML = '<p class="no-activity">No recent activity.</p>';
        return;
    }

    let html = '';
    activityGlobalLog.forEach(event => {
        const date = new Date(event.timestamp);
        const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateString = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

        html += `
            <div class="activity-item">
                <div class="activity-icon">
                    <span class="material-symbols-outlined">${event.icon}</span>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${event.action}</div>
                    <div class="activity-desc">${event.details}</div>
                </div>
                <div class="activity-time">${dateString}, ${timeString}</div>
            </div>
        `;
    });

    listContainer.innerHTML = html;
}

// Ensure it loads on start
loadActivityLog();

function saveSession() {
    localStorage.setItem(`dinku_chat_session_${currentSessionId}`, JSON.stringify(chatHistory));
    localStorage.setItem('dinku_current_session_id', currentSessionId);
    updateSessionsList();
}

function updateSessionsList() {
    const sessionsStr = localStorage.getItem('dinku_recent_sessions') || '{}';
    let sessions = {};
    try { sessions = JSON.parse(sessionsStr); } catch (e) { }

    // Update current session title if it has history
    if (chatHistory.length > 0) {
        if (!sessions[currentSessionId]) {
            // New session title from first user message
            const firstUserMsg = chatHistory.find(m => m.sender === 'user');
            if (firstUserMsg) {
                let title = firstUserMsg.text.substring(0, 30);
                if (firstUserMsg.text.length > 30) title += "...";
                sessions[currentSessionId] = {
                    title: title,
                    lastUpdate: Date.now()
                };
            }
        } else {
            sessions[currentSessionId].lastUpdate = Date.now();
        }
    }

    localStorage.setItem('dinku_recent_sessions', JSON.stringify(sessions));
    window.dispatchEvent(new CustomEvent('recent-sessions-updated', { detail: sessions }));
}

window.addEventListener('load-session', (e) => {
    const sessionId = e.detail;
    if (sessionId === currentSessionId) return;

    currentSessionId = sessionId;
    localStorage.setItem('dinku_current_session_id', currentSessionId);

    // Load data
    const savedSession = localStorage.getItem(`dinku_chat_session_${currentSessionId}`);
    try {
        chatHistory = savedSession ? JSON.parse(savedSession) : [];
        renderHistory();
        if (welcomeMsg) {
            if (chatHistory.length > 0) {
                welcomeMsg.classList.add('hidden');
                welcomeMsg.style.display = 'none';
            } else {
                welcomeMsg.classList.remove('hidden');
                welcomeMsg.style.display = 'flex';
            }
        }
    } catch (err) {
        console.error("Error loading session", err);
        chatHistory = [];
    }
});

// 8. Event Listeners
sendBtn.addEventListener('click', sendMessage);
promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

promptInput.addEventListener('input', () => {
    promptInput.style.height = 'auto';
    promptInput.style.height = Math.min(promptInput.scrollHeight, 200) + 'px';
    updateSendButtonState();
});

clearChatBtn?.addEventListener('click', async () => {
    const confirmed = await window.dinkuConfirm(
        'Reset Chat?',
        'This will permanently delete this conversation and start fresh.',
        'Reset',
        true
    );

    if (confirmed) {
        chatHistory = [];
        localStorage.removeItem(`dinku_chat_session_${currentSessionId}`);

        // Remove from sessions list
        const sessionsStr = localStorage.getItem('dinku_recent_sessions') || '{}';
        let sessions = {};
        try { sessions = JSON.parse(sessionsStr); } catch (e) { }
        delete sessions[currentSessionId];
        localStorage.setItem('dinku_recent_sessions', JSON.stringify(sessions));

        logActivity('Chat Reset', 'Cleared current conversation history', 'delete');
        location.reload();
    }
});

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const newTheme = document.body.classList.contains('light-mode') ? 'light' : 'dark';
    localStorage.setItem('dinku_theme', newTheme);
    logActivity('Theme Changed', `Switched app appearance to ${newTheme} mode`, 'contrast');
});

// 9. Background Animation
// 9. Background Animation System
let particles = [];
let animationId;
let currentEffect = localStorage.getItem('dinku_effect') || 'cyberstorm';
let startTime = Date.now();
let time = 0;

function initBackground(effectName) {
    // Cleanup
    particles = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    startTime = Date.now();
    if (animationId) cancelAnimationFrame(animationId);

    // Set new effect
    currentEffect = effectName;
    localStorage.setItem('dinku_effect', effectName);

    // Update Dropdown UI
    const selectedText = document.querySelector('#padels-select .text');
    if (selectedText) {
        const option = document.querySelector(`.padels-option[data-value="${effectName}"]`);
        if (option) {
            const labelText = option.querySelector('span:last-child').textContent;
            selectedText.textContent = labelText;

            // Sync active state
            document.querySelectorAll('.padels-option').forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
        } else {
            let displayName = effectName.charAt(0).toUpperCase() + effectName.slice(1);
            if (effectName === 'plain-dark') displayName = 'Plain Dark';
            if (effectName === 'plain-light') displayName = 'Plain Light';
            selectedText.textContent = displayName;
        }
    }

    // Initialize specific effect
    if (effectName === 'padels') {
        for (let i = 0; i < 100; i++) particles.push(new PadelsParticle());
    } else if (effectName === 'antigravity') {
        for (let i = 0; i < 400; i++) {
            particles.push(new AntigravityChunk());
        }
    } else if (effectName === 'rainbow') {
        const totalWaves = 8; // Denser rainbow
        for (let i = 0; i < totalWaves; i++) {
            particles.push(new Wave(i, totalWaves, true));
        }
    } else if (effectName === 'water') {
        const cols = Math.floor(canvas.width / 10); // Normal-res (was 3)
        const rows = Math.floor(canvas.height / 10);
        particles.push(new WaterSimulation(cols, rows));
    } else if (effectName === 'galaxy') {
        // The SpiralGalaxy class now manages its own stars and structure
        particles.push(new SpiralGalaxy());
    }
    else if (effectName === 'singularity') {
        particles.push(new SingularityCore());
        for (let i = 0; i < 200; i++) particles.push(new SingularityParticle());
    } else if (effectName === 'aurora') {
        particles.push(new Aurora());
    } else if (effectName === 'fireflies') {
        for (let i = 0; i < 50; i++) particles.push(new Firefly());
    } else if (effectName === 'nebula') {
        particles.push(new Nebula());
    } else if (effectName === 'matrix') {
        particles.push(new Matrix());
    } else if (effectName === 'prism') {
        particles.push(new Prism());
    } else if (effectName === 'cyberstorm') {
        particles.push(new CyberStorm());
    } else if (effectName === 'zerogravity') {
        for (let i = 0; i < 20; i++) {
            particles.push(new ZeroGravityObject());
        }
    } else if (effectName === 'plain-dark' || effectName === 'plain-light') {
        // No particles for plain modes
    }

    animate();
}

function animate() {
    // Only clear standardly if not an effect that manages its own fading/trails
    if (currentEffect !== 'antigravity' && currentEffect !== 'zerogravity') {
        if (currentEffect === 'plain-light') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (currentEffect === 'plain-dark') {
            ctx.fillStyle = '#0a0a0f';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    // Effect-specific quirks
    if (currentEffect === 'antigravity' || currentEffect === 'zerogravity') {
        const isLightMode = document.body.classList.contains('light-mode');
        ctx.fillStyle = isLightMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(10, 10, 15, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        time = (Date.now() - startTime) * 0.001;
    }

    // Generic particle loop for effects
    particles.forEach(p => {
        if (currentEffect === 'antigravity' && p.update) p.update(time);
        else if (p.update) p.update();
        else if (p.draw) p.draw();
    });

    animationId = requestAnimationFrame(animate);
}

// Effect Switcher Event Listeners
const padelsOptions = document.querySelectorAll('.padels-option');
padelsOptions.forEach(option => {
    option.addEventListener('click', (e) => {
        const optionEl = e.currentTarget;
        const effect = optionEl.getAttribute('data-value');

        // Update Label Text
        const selectText = document.querySelector('#padels-select .text');
        if (selectText) {
            selectText.textContent = optionEl.querySelector('span:last-child').textContent;
        }

        // Active State
        padelsOptions.forEach(opt => opt.classList.remove('active'));
        optionEl.classList.add('active');

        initBackground(effect);
    });
});

// Dropdown Toggle Logic (if not in CSS)
const padelsSelect = document.getElementById('padels-select');
if (padelsSelect) {
    padelsSelect.addEventListener('click', () => {
        padelsSelect.classList.toggle('active');
    });
    // Close on click outside
    document.addEventListener('click', (e) => {
        if (!padelsSelect.contains(e.target)) {
            padelsSelect.classList.remove('active');
        }
    });
}

// Start
initChatState();
initUsername();
initBackground(currentEffect);
initVoiceFeatures();
// animate(); removed, called inside initBackground
// Avatar Click to Open Identity (Profile Modal)
const mainAvatar = document.querySelector('.user-profile .avatar');
const sidebarProfileWidget = document.getElementById('user-profile-widget');

[mainAvatar, sidebarProfileWidget].forEach(elem => {
    if (elem) {
        elem.addEventListener('click', () => {
            const profileModal = document.getElementById('profile-modal');
            if (profileModal) {
                profileModal.style.display = 'block';
                // Trigger animation
                const card = profileModal.querySelector('.profile-modal-card');
                if (card) {
                    card.style.animation = 'none';
                    card.offsetHeight; /* trigger reflow */
                    card.style.animation = 'modalScaleIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
                }

                // Load current profile data
                if (typeof loadProfileData === 'function') loadProfileData();
            }
        });
    }
});

// Profile/Identity Save Functionality
function loadProfileData() {
    const savedName = localStorage.getItem('dinku_profile_name') || 'S';
    const savedColor = localStorage.getItem('dinku_profile_color') || 'linear-gradient(135deg, #ff7e5f, #feb47b)';
    const savedBio = localStorage.getItem('dinku_profile_bio') || '';
    const savedGithub = localStorage.getItem('dinku_profile_github') || '';
    const savedTwitter = localStorage.getItem('dinku_profile_twitter') || '';
    const savedWebsite = localStorage.getItem('dinku_profile_website') || '';

    const nameInput = document.getElementById('profile-name-input');
    const bioInput = document.getElementById('profile-bio-input');
    const githubInput = document.getElementById('profile-github-input');
    const twitterInput = document.getElementById('profile-twitter-input');
    const websiteInput = document.getElementById('profile-website-input');

    const heroName = document.getElementById('hero-display-name');
    const avatarPreview = document.getElementById('profile-avatar-preview');
    const auraPulse = document.getElementById('aura-effect');
    const homeAuraPulse = document.getElementById('home-aura-effect');
    const avatarText = document.getElementById('profile-avatar-text');

    if (nameInput) nameInput.value = savedName;
    if (bioInput) bioInput.value = savedBio;
    if (githubInput) githubInput.value = savedGithub;
    if (twitterInput) twitterInput.value = savedTwitter;
    if (websiteInput) websiteInput.value = savedWebsite;

    if (heroName) heroName.textContent = savedName;
    if (avatarPreview) avatarPreview.style.background = savedColor;
    if (auraPulse) auraPulse.style.background = savedColor;
    if (homeAuraPulse) homeAuraPulse.style.background = savedColor;
    if (avatarText) avatarText.textContent = savedName.charAt(0).toUpperCase();

    // Mark selected color
    const colorOptions = document.querySelectorAll('.color-option-v2');
    colorOptions.forEach(opt => {
        if (opt.getAttribute('data-color') === savedColor) {
            opt.classList.add('selected');
        } else {
            opt.classList.remove('selected');
        }
    });
}

function saveProfileData() {
    const nameInput = document.getElementById('profile-name-input');
    const bioInput = document.getElementById('profile-bio-input');
    const githubInput = document.getElementById('profile-github-input');
    const twitterInput = document.getElementById('profile-twitter-input');
    const websiteInput = document.getElementById('profile-website-input');
    const selectedColor = document.querySelector('.color-option-v2.selected');

    if (nameInput && nameInput.value.trim()) {
        const name = nameInput.value.trim();
        const color = selectedColor ? selectedColor.getAttribute('data-color') : localStorage.getItem('dinku_profile_color') || 'linear-gradient(135deg, #ff7e5f, #feb47b)';

        const bio = bioInput ? bioInput.value.trim() : '';
        const github = githubInput ? githubInput.value.trim() : '';
        const twitter = twitterInput ? twitterInput.value.trim() : '';
        const website = websiteInput ? websiteInput.value.trim() : '';

        // Save to localStorage
        localStorage.setItem('dinku_profile_name', name);
        localStorage.setItem('dinku_profile_color', color);
        localStorage.setItem('dinku_profile_bio', bio);
        localStorage.setItem('dinku_profile_github', github);
        localStorage.setItem('dinku_profile_twitter', twitter);
        localStorage.setItem('dinku_profile_website', website);

        // Update main avatar (Sidebar/Header)
        const mainAvatar = document.querySelector('.user-profile .avatar');
        if (mainAvatar) {
            mainAvatar.textContent = name.charAt(0).toUpperCase();
            mainAvatar.style.background = color;
        }

        // Update Hero Preview
        const heroName = document.getElementById('hero-display-name');
        if (heroName) heroName.textContent = name;

        const avatarPreview = document.getElementById('profile-avatar-preview');
        const avatarText = document.getElementById('profile-avatar-text');
        const auraPulse = document.getElementById('aura-effect');
        const homeAuraPulse = document.getElementById('home-aura-effect');
        if (avatarPreview) avatarPreview.style.background = color;
        if (auraPulse) auraPulse.style.background = color;
        if (homeAuraPulse) homeAuraPulse.style.background = color;
        if (avatarText) avatarText.textContent = name.charAt(0).toUpperCase();

        logActivity('Identity Sync', 'Updated profile information and aesthetics', 'bolt');

        // Show success feedback
        const saveBtn = document.getElementById('save-profile-btn');
        if (saveBtn) {
            const originalHTML = saveBtn.innerHTML;
            saveBtn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> IDENTITY SYNCED';
            saveBtn.style.background = "linear-gradient(90deg, #34A853 0%, #4285F4 100%)";

            setTimeout(() => {
                saveBtn.innerHTML = originalHTML;
                saveBtn.style.background = "";
                const profileModal = document.getElementById('profile-modal');
                if (profileModal) profileModal.style.display = 'none';
            }, 1200);
        }
    }
}

// Real-time Preview: Name
const profileNameInput = document.getElementById('profile-name-input');
profileNameInput?.addEventListener('input', (e) => {
    const val = e.target.value.trim() || 'anon';
    const heroName = document.getElementById('hero-display-name');
    const avatarText = document.getElementById('profile-avatar-text');
    if (heroName) heroName.textContent = val;
    if (avatarText) avatarText.textContent = val.charAt(0).toUpperCase();
});

// Real-time Preview: Aura Color
const colorOptionsV2 = document.querySelectorAll('.color-option-v2');
colorOptionsV2.forEach(option => {
    option.addEventListener('click', () => {
        colorOptionsV2.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');

        const color = option.getAttribute('data-color');
        const avatarPreview = document.getElementById('profile-avatar-preview');
        const auraPulse = document.getElementById('aura-effect');
        const homeAuraPulse = document.getElementById('home-aura-effect');
        if (avatarPreview) avatarPreview.style.background = color;
        if (auraPulse) auraPulse.style.background = color;
        if (homeAuraPulse) homeAuraPulse.style.background = color;
    });
});

// Save Profile Button
const saveProfileBtn = document.getElementById('save-profile-btn');
if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', () => {
        saveProfileData();
    });
}

// Clear Activity Log Button
const clearActivityBtn = document.getElementById('clear-activity-btn');
if (clearActivityBtn) {
    clearActivityBtn.addEventListener('click', async () => {
        const confirmed = await window.dinkuConfirm(
            'Clear Activity History?',
            'This will permanently delete your activity log. This cannot be undone.',
            'Clear History',
            true
        );

        if (confirmed) {
            activityGlobalLog = [];
            saveActivityLog();
            renderActivityLog();
        }
    });
}

// Load profile data on page load
window.addEventListener('DOMContentLoaded', () => {
    const savedName = localStorage.getItem('dinku_profile_name') || 'S';
    const savedColor = localStorage.getItem('dinku_profile_color') || 'linear-gradient(135deg, #ff7e5f, #feb47b)';

    const mainAvatar = document.querySelector('.user-profile .avatar');
    if (mainAvatar) {
        mainAvatar.textContent = savedName.charAt(0).toUpperCase();
        mainAvatar.style.background = savedColor;
    }
});

// Event Delegation for Closing Modals (More Robust)
document.addEventListener('click', (e) => {
    // Close Main Modals (Settings/Activity)
    if (e.target.closest('.close-modal-btn')) {
        const sModal = document.getElementById('settings-modal');
        const aModal = document.getElementById('activity-modal');
        if (sModal) sModal.style.display = 'none';
        if (aModal) aModal.style.display = 'none';
    }

    // Close Activity Specific
    if (e.target.closest('.close-activity-btn')) {
        const aModal = document.getElementById('activity-modal');
        if (aModal) aModal.style.display = 'none';
    }

    // Close Profile/Identity Modal
    if (e.target.closest('.close-profile')) {
        const profileModal = document.getElementById('profile-modal');
        if (profileModal) profileModal.style.display = 'none';
    }
});

// Windows-style close on outside click
window.addEventListener('click', (e) => {
    const sModal = document.getElementById('settings-modal');
    const aModal = document.getElementById('activity-modal');
    const prModal = document.getElementById('preview-modal');
    const pModal = document.getElementById('profile-modal');

    if (e.target === sModal) {
        sModal.style.display = 'none';
        sModal.classList.remove('active');
    }
    if (e.target === aModal) {
        aModal.style.display = 'none';
        aModal.classList.remove('active');
    }
    if (e.target === prModal) {
        prModal.style.display = 'none';
        prModal.classList.remove('active');
    }
    if (e.target === pModal) {
        pModal.style.display = 'none';
        pModal.classList.remove('active');
    }
});

// Code Block Actions Delegation
chatArea.addEventListener('click', (e) => {
    const copyBtn = e.target.closest('.copy-code-btn');
    const previewBtn = e.target.closest('.preview-code-btn');

    if (copyBtn) {
        const code = copyBtn.closest('.code-block').querySelector('code').innerText;
        navigator.clipboard.writeText(code);
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<span class="material-symbols-outlined">check</span> Copied';
        setTimeout(() => copyBtn.innerHTML = originalText, 2000);
    }

    if (previewBtn) {
        e.stopPropagation(); // Prevent closing immediately
        const codeBlock = previewBtn.closest('.code-block');
        const code = codeBlock.querySelector('code').innerText;
        const lang = codeBlock.getAttribute('data-lang');
        openLivePreview(code, lang);
    }
});

// Top bar preview
document.getElementById('top-preview-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (window.latestPreviewableCode) {
        openLivePreview(window.latestPreviewableCode.code, window.latestPreviewableCode.lang);
    }
});

// Preview Modal Close/Refresh/Back
document.getElementById('back-preview-btn')?.addEventListener('click', () => {
    const frame = document.getElementById('preview-frame');
    if (frame && frame.contentWindow) {
        frame.contentWindow.history.back();
    }
});

document.getElementById('close-preview-btn')?.addEventListener('click', () => {
    document.getElementById('preview-modal').style.display = 'none';
});

document.getElementById('refresh-preview-btn')?.addEventListener('click', () => {
    const frame = document.getElementById('preview-frame');
    const currentSrc = frame.srcdoc;
    frame.srcdoc = '';
    setTimeout(() => frame.srcdoc = currentSrc, 50);
});

// --- PREMIUM CONFIRMATION SYSTEM ---
window.dinkuConfirm = function (title, message, btnText = "Confirm", isDanger = true) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirm-modal');
        const titleEl = document.getElementById('confirm-title');
        const messageEl = document.getElementById('confirm-message');
        const proceedBtn = document.getElementById('confirm-proceed');
        const cancelBtn = document.getElementById('confirm-cancel');

        if (!modal) return resolve(false);

        titleEl.textContent = title;
        messageEl.textContent = message;
        proceedBtn.textContent = btnText;

        if (isDanger) {
            proceedBtn.className = 'confirm-btn danger';
        } else {
            proceedBtn.className = 'confirm-btn primary'; // You might need to add .primary to CSS if used
        }

        modal.style.display = 'flex';
        modal.classList.add('active');

        const cleanup = (value) => {
            modal.style.display = 'none';
            modal.classList.remove('active');
            proceedBtn.removeEventListener('click', onProceed);
            cancelBtn.removeEventListener('click', onCancel);
            modal.removeEventListener('click', onBackdropClick);
            resolve(value);
        };

        function onProceed() { cleanup(true); }
        function onCancel() { cleanup(false); }
        function onBackdropClick(e) {
            if (e.target === modal) cleanup(false);
        }

        proceedBtn.addEventListener('click', onProceed);
        cancelBtn.addEventListener('click', onCancel);
        modal.addEventListener('click', onBackdropClick);
    });
};

console.log("Dinku Chat System: Script Load Complete");

//===========================================
// SETTINGS MODAL - CHATGPT STYLE
//===========================================

// Settings Modal Elements
const settingsModal = document.getElementById('settings-modal');
const closeSettings = document.querySelector('.close-settings');
const settingsNavItems = document.querySelectorAll('.settings-nav-item');
const settingsSections = document.querySelectorAll('.settings-section');

// Open Settings Modal
function openSettings() {
    if (settingsModal) {
        settingsModal.style.display = 'flex';
        loadSettings();
    }
}

// Close Settings Modal
function closeSettingsModal() {
    if (settingsModal) {
        settingsModal.style.display = 'none';
    }
}

if (closeSettings) {
    closeSettings.addEventListener('click', closeSettingsModal);
}

// Close on backdrop click
if (settingsModal) {
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            closeSettingsModal();
        }
    });
}

// Category Navigation
settingsNavItems.forEach(item => {
    item.addEventListener('click', () => {
        const section = item.getAttribute('data-section');

        // Update nav items
        settingsNavItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        // Update sections
        settingsSections.forEach(sec => sec.classList.remove('active'));
        const targetSection = document.getElementById(`${section}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }
    });
});

// Theme Selector
const themeOptions = document.querySelectorAll('.theme-option');
themeOptions.forEach(option => {
    option.addEventListener('click', () => {
        const theme = option.getAttribute('data-theme');
        themeOptions.forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');

        // Apply theme
        if (theme === 'light') {
            document.body.classList.add('light-mode');
            localStorage.setItem('dinku_theme', 'light');
        } else {
            document.body.classList.remove('light-mode');
            localStorage.setItem('dinku_theme', 'dark');
        }
    });
});

// Model Selector
const modelOptions = document.querySelectorAll('.model-option');
modelOptions.forEach(option => {
    option.addEventListener('click', () => {
        const model = option.getAttribute('data-model');
        modelOptions.forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
        localStorage.setItem('dinku_model', model);
    });
});

// Creativity Slider
const creativitySlider = document.getElementById('creativity-slider');
const creativityValue = document.getElementById('creativity-value');

if (creativitySlider && creativityValue) {
    creativitySlider.addEventListener('input', (e) => {
        const value = e.target.value;
        creativityValue.textContent = value + '%';
        localStorage.setItem('dinku_creativity', value);
    });
}

// Font Size Select
const fontSizeSelect = document.getElementById('font-size-select');
if (fontSizeSelect) {
    fontSizeSelect.addEventListener('change', (e) => {
        const size = e.target.value;
        localStorage.setItem('dinku_font_size', size);
        applyFontSize(size);
    });
}

function applyFontSize(size) {
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        chatMessages.classList.remove('font-small', 'font-normal', 'font-large');
        chatMessages.classList.add(`font-${size}`);
    }
}

// Response Style Select
const responseStyleSelect = document.getElementById('response-style-select');
if (responseStyleSelect) {
    responseStyleSelect.addEventListener('change', (e) => {
        const style = e.target.value;
        localStorage.setItem('dinku_response_style', style);
    });
}

// Custom Instructions
const customInstructionsTextarea = document.getElementById('custom-instructions');
if (customInstructionsTextarea) {
    customInstructionsTextarea.addEventListener('blur', (e) => {
        localStorage.setItem('dinku_custom_instructions', e.target.value);
    });
}

// Auto-read Toggle
const autoReadToggleFlag = document.getElementById('auto-read-toggle');
if (autoReadToggleFlag) {
    autoReadToggleFlag.addEventListener('change', (e) => {
        localStorage.setItem('dinku_auto_read', e.target.checked);
    });
}

// Experimental Features Toggle
const experimentalToggleFlag = document.getElementById('experimental-toggle');
if (experimentalToggleFlag) {
    experimentalToggleFlag.addEventListener('change', (e) => {
        localStorage.setItem('dinku_experimental', e.target.checked);
    });
}

// Developer Mode Toggle
const developerToggleFlag = document.getElementById('developer-toggle');
if (developerToggleFlag) {
    developerToggleFlag.addEventListener('change', (e) => {
        localStorage.setItem('dinku_developer_mode', e.target.checked);
    });
}

// Export Data (Full Backup)
const exportDataButton = document.getElementById('export-data-btn');
if (exportDataButton) {
    exportDataButton.addEventListener('click', () => {
        const backup = {
            version: "1.5.0",
            exportDate: new Date().toISOString(),
            settings: {},
            sessions: {}
        };

        // Collect all Dinku-related localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('dinku_')) {
                const value = localStorage.getItem(key);
                if (key.startsWith('dinku_chat_session_')) {
                    try { backup.sessions[key] = JSON.parse(value); } catch (e) { }
                } else {
                    backup.settings[key] = value;
                }
            }
        }

        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dinku-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });
}

// Clear Data
const clearDataButton = document.getElementById('clear-data-btn');
if (clearDataButton) {
    clearDataButton.addEventListener('click', async () => {
        const confirmed = await window.dinkuConfirm(
            'Purge All Data?',
            'This will permanently delete all conversations, settings, and browsing history. This cannot be undone.',
            'Delete Everything',
            true
        );

        if (confirmed) {
            localStorage.clear(); // Nuclear option for "Clear All Data"
            location.reload();
        }
    });
}

// Calculate Storage Usage
function calculateStorageUsage() {
    const storageDisplay = document.getElementById('storage-display');
    if (!storageDisplay) return;

    let total = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            total += (localStorage[key].length + key.length) * 2; // Roughly 2 bytes per character
        }
    }

    const kb = (total / 1024).toFixed(2);
    storageDisplay.textContent = `${kb} KB used`;
}

// Load Settings from localStorage
function loadSettings() {
    // Theme
    const savedTheme = localStorage.getItem('dinku_theme') || 'dark';
    themeOptions.forEach(opt => {
        opt.classList.toggle('active', opt.getAttribute('data-theme') === savedTheme);
    });
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
    }

    // Model
    const savedModel = localStorage.getItem('dinku_model') || 'dinku-pro';
    modelOptions.forEach(opt => {
        opt.classList.toggle('active', opt.getAttribute('data-model') === savedModel);
    });

    // Creativity
    const savedCreativity = localStorage.getItem('dinku_creativity') || '50';
    if (creativitySlider) creativitySlider.value = savedCreativity;
    if (creativityValue) creativityValue.textContent = savedCreativity + '%';

    // Font Size
    const savedFontSize = localStorage.getItem('dinku_font_size') || 'normal';
    if (fontSizeSelect) fontSizeSelect.value = savedFontSize;
    applyFontSize(savedFontSize);

    // Response Style
    const savedResponseStyle = localStorage.getItem('dinku_response_style') || 'balanced';
    if (responseStyleSelect) responseStyleSelect.value = savedResponseStyle;

    // Custom Instructions
    const savedInstructions = localStorage.getItem('dinku_custom_instructions') || '';
    if (customInstructionsTextarea) customInstructionsTextarea.value = savedInstructions;

    // Auto-read
    const savedAutoRead = localStorage.getItem('dinku_auto_read') === 'true';
    if (autoReadToggleFlag) autoReadToggleFlag.checked = savedAutoRead;

    // Experimental
    const savedExperimental = localStorage.getItem('dinku_experimental') === 'true';
    if (experimentalToggleFlag) experimentalToggleFlag.checked = savedExperimental;

    // Developer Mode
    const savedDeveloper = localStorage.getItem('dinku_developer_mode') === 'true';
    if (developerToggleFlag) developerToggleFlag.checked = savedDeveloper;

    // Storage Usage
    calculateStorageUsage();
}

// --- Auto-Update System ---
let currentVersion = '1.5.0'; // Hardcoded fallback matching version.json

async function checkForUpdates() {
    try {
        // Fetch with a timestamp to bust any intermediary caches
        const response = await fetch(`/version.json?t=${Date.now()}`);
        if (!response.ok) return;

        const data = await response.json();
        const serverVersion = data.version;

        if (serverVersion !== currentVersion) {
            console.log(`Update available: ${currentVersion} -> ${serverVersion}`);
            showUpdateToast(serverVersion);
            // Stop polling once we know an update is available
            clearInterval(updateInterval);
        }
    } catch (e) {
        console.warn("Update check failed:", e);
    }
}

function showUpdateToast(newVersion) {
    if (document.getElementById('update-toast')) return;

    const toast = document.createElement('div');
    toast.id = 'update-toast';
    toast.innerHTML = `
        <div class="update-toast-content">
            <span class="material-symbols-outlined">system_update</span>
            <div class="update-text">
                <strong>Update Available (v${newVersion})</strong>
                <p>A new version of Dinku is ready.</p>
            </div>
            <button onclick="window.location.reload(true)" class="update-btn">Update</button>
        </div>
    `;
    document.body.appendChild(toast);
}

// Initial check after 5 seconds
setTimeout(checkForUpdates, 5000);
// Check every 5 minutes
const updateInterval = setInterval(checkForUpdates, 5 * 60 * 1000);

// Initialize settings on page load
window.addEventListener('DOMContentLoaded', () => {
    loadSettings();

    // Attempt to grab current version from actual file if possible
    fetch('/version.json').then(r => r.json()).then(d => { currentVersion = d.version; }).catch(() => { });

    // AI Shortcuts Click Handler
    document.querySelectorAll('.shortcut-card').forEach(card => {
        card.addEventListener('click', () => {
            const prompt = card.getAttribute('data-prompt');
            if (prompt && promptInput) {
                promptInput.value = prompt;
                sendMessage();
            }
        });
    });
});

// Expose openSettings to global scope for header icon
window.openSettings = openSettings;

// Top Bar Preview Logic (Detect latest previewable code block)
const topPreviewBtn = document.getElementById('top-preview-btn');
if (topPreviewBtn) {
    topPreviewBtn.addEventListener('click', () => {
        const previewableBlocks = document.querySelectorAll('.preview-code-btn');
        if (previewableBlocks.length > 0) {
            const lastBlock = previewableBlocks[previewableBlocks.length - 1];
            lastBlock.click();
        }
    });

    // Observer to show/hide top preview button
    const observer = new MutationObserver(() => {
        const hasPreviewable = document.querySelector('.preview-code-btn') !== null;
        topPreviewBtn.classList.toggle('hidden', !hasPreviewable);
    });
    observer.observe(chatArea, { childList: true, subtree: true });
}
