import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "....",
  authDomain: "....firebaseapp.com",
  projectId: "....",
  storageBucket: "....",
  messagingSenderId: "....",
  appId: "...."
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export async function ensureAnonymousAuth() {
  if (auth.currentUser) return auth.currentUser;
  const result = await signInAnonymously(auth);
  return result.user;
}

export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback);
}