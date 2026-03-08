import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "여기에_복붙",
  authDomain: "여기에_복붙",
  projectId: "여기에_복붙",
  storageBucket: "여기에_복붙",
  messagingSenderId: "여기에_복붙",
  appId: "여기에_복붙",
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