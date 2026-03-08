import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyApLCZ9tFiYRUE4A8jaAuy2nwhza2BHPF8y",
  authDomain: "kshs-achievement-archive.firebaseapp.com",
  projectId: "kshs-achievement-archive",
  storageBucket: "kshs-achievement-archive.firebasestorage.app",
  messagingSenderId: "145434041352",
  appId: "1:145434041352:web:95b473c52baa9575bf45bd",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export async function ensureAnonymousAuth() {
  if (auth.currentUser) return auth.currentUser;
  const credential = await signInAnonymously(auth);
  return credential.user;
}

export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback);
}