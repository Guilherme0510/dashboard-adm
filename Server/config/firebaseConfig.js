import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyDxAoPntmqIeKh0oyleTOQfGdIti0qWrPI",
    authDomain: "crm-maps-593d1.firebaseapp.com",
    projectId: "crm-maps-593d1",
    storageBucket: "crm-maps-593d1.firebasestorage.app",
    messagingSenderId: "701120893959",
    appId: "1:701120893959:web:5842b637e166d83a2346a2",
    measurementId: "G-VKE8FZD0XS"
  };


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

