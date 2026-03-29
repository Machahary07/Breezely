// Firebase configuration for Breezely Extension
// This mirrors the frontend's Firebase config

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyBmkJrZ7Udts1okkBYzCvLa2na9E_0quY8",
    authDomain: "breezely-001.firebaseapp.com",
    projectId: "breezely-001",
    storageBucket: "breezely-001.firebasestorage.app",
    messagingSenderId: "399932147269",
    appId: "1:399932147269:web:9801b6d9a955d019bdc52c",
    measurementId: "G-2HBGNTB8L5"
};

// Initialize Firebase (compat mode for extension)
let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;
let currentUser = null;
let userApiKeys = {};

function initFirebase() {
    if (typeof firebase === 'undefined') {
        console.warn("Firebase SDK not loaded yet");
        return;
    }

    if (!firebaseApp) {
        firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
    }

    firebaseAuth = firebase.auth();
    firebaseDb = firebase.firestore();

    // Listen for auth state changes
    firebaseAuth.onAuthStateChanged((user) => {
        currentUser = user;
        if (user) {
            console.log("Extension: User authenticated:", user.email);
            loadUserApiKeys(user.uid);
            updateAuthUI(true, user);
        } else {
            console.log("Extension: User not authenticated");
            userApiKeys = {};
            updateAuthUI(false, null);
        }
    });
}

function loadUserApiKeys(uid) {
    const docRef = firebaseDb.collection('users').doc(uid).collection('settings').doc('credentials');
    
    // Real-time listener for API key changes
    docRef.onSnapshot((docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            userApiKeys = {};
            
            if (data.gemini) userApiKeys.gemini = data.gemini;
            if (data.claude) userApiKeys.claude = data.claude;
            if (data.openai) userApiKeys.openai = data.openai;

            console.log("Extension: API keys loaded for providers:", Object.keys(userApiKeys).join(', '));
            updateKeyStatus();
        } else {
            userApiKeys = {};
            updateKeyStatus();
        }
    }, (error) => {
        console.error("Extension: Error loading API keys:", error);
    });
}

function getApiKeyForModel(model) {
    return userApiKeys[model] || null;
}

function updateAuthUI(isLoggedIn, user) {
    const authStatus = document.getElementById('auth-status');
    if (!authStatus) return;

    if (isLoggedIn && user) {
        authStatus.innerHTML = `
            <div class="auth-info">
                <span class="auth-dot connected"></span>
                <span class="auth-name">${user.displayName || user.email || 'Connected'}</span>
            </div>
        `;
    } else {
        authStatus.innerHTML = `
            <div class="auth-info">
                <span class="auth-dot disconnected"></span>
                <span class="auth-name">Not connected</span>
            </div>
        `;
    }
}

function updateKeyStatus() {
    const modelSelect = document.getElementById('model-select');
    if (!modelSelect) return;

    const currentModel = modelSelect.value;
    const keyIndicator = document.getElementById('key-status');
    
    if (keyIndicator) {
        if (userApiKeys[currentModel]) {
            keyIndicator.className = 'key-indicator has-key';
            keyIndicator.title = `${currentModel} API key active`;
        } else {
            keyIndicator.className = 'key-indicator no-key';
            keyIndicator.title = `No ${currentModel} API key — set one in the Breezely Console`;
        }
    }
}

async function signInWithGoogle() {
    if (!firebaseAuth) return;

    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        await firebaseAuth.signInWithPopup(provider);
    } catch (error) {
        console.error("Extension: Sign-in failed:", error);
    }
}

async function signOutUser() {
    if (!firebaseAuth) return;
    
    try {
        await firebaseAuth.signOut();
        userApiKeys = {};
    } catch (error) {
        console.error("Extension: Sign-out failed:", error);
    }
}
