import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, set, get, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCp1i2dwApQW_toZBK7g5_sJjYMidyupnE",
  authDomain: "zimu-d4c93.firebaseapp.com",
  databaseURL: "https://zimu-d4c93-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "zimu-d4c93",
  storageBucket: "zimu-d4c93.firebasestorage.app",
  messagingSenderId: "358931344183",
  appId: "1:358931344183:web:60163b7ab6c3fd30ed48b2",
  measurementId: "G-MHX9HP76TS"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const googleProvider = new GoogleAuthProvider();

// ── Auth Functions ──

// Handle redirect result (fires on page load after redirect sign-in)
getRedirectResult(auth).then((result) => {
  // Result is handled by onAuthStateChanged listener
}).catch((error) => {
  console.error("Redirect sign-in error:", error?.message);
});

export async function signInWithGoogle() {
  try {
    // Try popup first (works on desktop)
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null };
  } catch (error) {
    // If popup blocked/failed, fall back to redirect (better for mobile)
    if (
      error.code === "auth/popup-blocked" ||
      error.code === "auth/popup-closed-by-user" ||
      error.code === "auth/cancelled-popup-request" ||
      error.code === "auth/operation-not-supported-in-this-environment"
    ) {
      try {
        await signInWithRedirect(auth, googleProvider);
        return { user: null, error: null }; // Redirect will reload the page
      } catch (redirectError) {
        return { user: null, error: redirectError.message };
      }
    }
    return { user: null, error: error.message };
  }
}

export async function signInWithEmail(email, password) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { user: result.user, error: null };
  } catch (error) {
    let msg = "Giriş başarısız";
    if (error.code === "auth/user-not-found") msg = "Bu email ile kayıtlı kullanıcı yok";
    if (error.code === "auth/wrong-password") msg = "Şifre hatalı";
    if (error.code === "auth/invalid-email") msg = "Geçersiz email adresi";
    if (error.code === "auth/invalid-credential") msg = "Email veya şifre hatalı";
    return { user: null, error: msg };
  }
}

export async function registerWithEmail(email, password) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return { user: result.user, error: null };
  } catch (error) {
    let msg = "Kayıt başarısız";
    if (error.code === "auth/email-already-in-use") msg = "Bu email zaten kayıtlı";
    if (error.code === "auth/weak-password") msg = "Şifre en az 6 karakter olmalı";
    if (error.code === "auth/invalid-email") msg = "Geçersiz email adresi";
    return { user: null, error: msg };
  }
}

export async function logOut() {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// ── Database Functions ──
export async function saveUserData(userId, data) {
  try {
    const userRef = ref(db, `users/${userId}`);
    await set(userRef, {
      ...data,
      updatedAt: Date.now(),
    });
    return true;
  } catch (error) {
    console.error("Firebase save error:", error);
    return false;
  }
}

export async function loadUserData(userId) {
  try {
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    console.error("Firebase load error:", error);
    return null;
  }
}

export function onUserDataChange(userId, callback) {
  const userRef = ref(db, `users/${userId}`);
  return onValue(userRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    }
  });
}

export { auth, db };
