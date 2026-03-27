import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBmkJrZ7Udts1okkBYzCvLa2na9E_0quY8",
  authDomain: "breezely-001.firebaseapp.com",
  projectId: "breezely-001",
  storageBucket: "breezely-001.firebasestorage.app",
  messagingSenderId: "399932147269",
  appId: "1:399932147269:web:9801b6d9a955d019bdc52c",
  measurementId: "G-2HBGNTB8L5"
};

const app = initializeApp(firebaseConfig);
let analytics: ReturnType<typeof getAnalytics> | undefined;

if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { app, analytics };
