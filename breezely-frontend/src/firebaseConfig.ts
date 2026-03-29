import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { environment } from "./environments/environment";

const app = initializeApp(environment.firebase);
let analytics: ReturnType<typeof getAnalytics> | undefined;

const db = getFirestore(app);
const auth = getAuth(app);

// Connect to emulators if not in production mode
if (!environment.production) {
  // connectAuthEmulator(auth, "http://127.0.0.1:9099"); // Uncomment if using Auth Emulator
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}

if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { app, analytics, db, auth };
