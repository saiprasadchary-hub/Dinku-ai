import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyA_uROAOxe1fY-wJzE_m_ZLFd6gxfkyGqo",
    authDomain: "dinkuu-ai.firebaseapp.com",
    projectId: "dinkuu-ai",
    storageBucket: "dinkuu-ai.firebasestorage.app",
    messagingSenderId: "974116042954",
    appId: "1:974116042954:web:f7275934edda62347a1c33",
    measurementId: "G-LFNCRB7GX1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged, collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp, where };
