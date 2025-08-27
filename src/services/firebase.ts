import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, type User } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}

let userId: string | null = null;

onAuthStateChanged(auth, (user: User | null) => {
  if (user) {
    userId = user.uid;
  }
});

export const authenticate = async (): Promise<string | null> => {
  if (auth.currentUser) {
    userId = auth.currentUser.uid;
    return userId;
  }
  try {
    const userCredential = await signInAnonymously(auth);
    userId = userCredential.user.uid;
    return userId;
  } catch (error) {
    console.error("Firebase authentication failed:", error);
    return null;
  }
};

export const saveDbToFirestore = async (dbData: Uint8Array): Promise<boolean> => {
  if (!userId || !dbData) return false;
  try {
    const base64Data = uint8ArrayToBase64(dbData);
    const docRef = doc(firestore, 'users', userId);
    await setDoc(docRef, { dbState: base64Data, lastSaved: new Date() });
    return true;
  } catch (error) {
    console.error("Firestore write error:", error);
    return false;
  }
};

export const loadDbFromFirestore = async (): Promise<Uint8Array | null> => {
  if (!userId) return null;
  try {
    const docRef = doc(firestore, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return base64ToUint8Array(data.dbState);
    }
    return null;
  } catch (error) {
    console.error("Firestore read error:", error);
    return null;
  }
};