import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyApLCZ9tFiYRUE4A8jaAuy2nwhza2BHPF8",
  authDomain: "kshs-achievement-archive.firebaseapp.com",
  projectId: "kshs-achievement-archive",
  storageBucket: "kshs-achievement-archive.firebasestorage.app",
  messagingSenderId: "145434041352",
  appId: "1:145434041352:web:95b473c52baa9575bf45bd",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);