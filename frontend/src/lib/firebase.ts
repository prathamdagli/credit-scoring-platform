import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your actual Firebase config from the Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyChlkjY4Rz86zwB4wq3GVxOe044x0rG8GA",
    authDomain: "creditscoringforunbankked.firebaseapp.com",
    projectId: "creditscoringforunbankked",
    storageBucket: "creditscoringforunbankked.firebasestorage.app",
    messagingSenderId: "824990210105", // From project number
    appId: "1:824990210105:web:a36fc2921a60bebd2195e8",
    measurementId: "G-CW6JWP3E0L"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
