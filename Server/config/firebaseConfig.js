import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyBeDoOf4QSzRj-v2l9y8zhz6nbVvv2q0X4",
  authDomain: "crm-search-6a76d.firebaseapp.com",
  projectId: "crm-search-6a76d",
  storageBucket: "crm-search-6a76d.firebasestorage.app",
  messagingSenderId: "653003039766",
  appId: "1:653003039766:web:c2ae6dee84813482f80137",
  measurementId: "G-VQX3GHQY6S"
  };


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

