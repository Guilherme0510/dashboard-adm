import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_APP_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_APP_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_APP_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_APP_FIREBASE_MEASUREMENT_ID

  // apiKey: "AIzaSyAv14rERK5d3G9_qwN-YOOGslPnPcDwtG0",
  // authDomain: "test-e9567.firebaseapp.com",
  // projectId: "test-e9567",
  // storageBucket: "test-e9567.appspot.com",
  // messagingSenderId: "861061406484",
  // appId: "1:861061406484:web:626c360a227d0befd96c01",
  // measurementId: "G-XRE4YMX1GW"

  // apiKey: "AIzaSyAJeF8VtrPYFJhYFtm1n4sj_NXLrcP8t_g",
  // authDomain: "crm-tfgestao.firebaseapp.com",
  // projectId: "crm-tfgestao",
  // storageBucket: "crm-tfgestao.firebasestorage.app",
  // messagingSenderId: "214326679546",
  // appId: "1:214326679546:web:5102847e9f1ad98d7e7643",
  // measurementId: "G-L9QS3K0R1S"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

