import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { environment } from "./environments/environment";

const app = initializeApp(environment.firebase);
let analytics: ReturnType<typeof getAnalytics> | undefined;

if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { app, analytics };
