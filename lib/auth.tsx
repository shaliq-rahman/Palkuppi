"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword,
  signOut, updateProfile, type User as FirebaseUser,
} from "firebase/auth";
import { firebaseReady, getFirebase } from "./firebase";

export type User = { uid: string; email: string; name: string };

type Ctx = {
  ready: boolean;
  configured: boolean;
  user: User | null;
  signUp: (name: string, email: string, password: string) => Promise<string | null>;
  logIn: (email: string, password: string) => Promise<string | null>;
  resetPassword: (email: string) => Promise<string | null>;
  logOut: () => Promise<void>;
};
const AuthContext = createContext<Ctx | null>(null);

const toUser = (u: FirebaseUser): User => ({ uid: u.uid, email: u.email ?? "", name: u.displayName || (u.email ?? "").split("@")[0] });

/** Turn Firebase error codes into plain sentences. */
export function authMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/invalid-email": return "That email address doesn't look right.";
    case "auth/missing-password": return "Please enter your password.";
    case "auth/weak-password": return "Password must be at least 6 characters.";
    case "auth/email-already-in-use": return "An account with this email already exists. Try logging in.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found": return "Wrong email or password.";
    case "auth/too-many-requests": return "Too many attempts. Wait a minute and try again.";
    case "auth/network-request-failed": return "No connection. Check your internet and try again.";
    case "auth/operation-not-allowed": return "Email/password sign-in isn't enabled in Firebase yet.";
    default: return "Something went wrong. Please try again.";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!firebaseReady);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!firebaseReady) return;
    const { auth } = getFirebase();
    return onAuthStateChanged(auth, (u) => {
      setUser(u ? toUser(u) : null);
      setReady(true);
    });
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    if (!name.trim()) return "Please enter your name.";
    try {
      const { auth } = getFirebase();
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: name.trim() });
      setUser(toUser({ ...cred.user, displayName: name.trim() } as FirebaseUser));
      return null;
    } catch (e) { return authMessage(e); }
  }, []);

  const logIn = useCallback(async (email: string, password: string) => {
    try {
      const { auth } = getFirebase();
      await signInWithEmailAndPassword(auth, email.trim(), password);
      return null;
    } catch (e) { return authMessage(e); }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (!email.trim()) return "Enter your email above first.";
    try {
      const { auth } = getFirebase();
      await sendPasswordResetEmail(auth, email.trim());
      return null;
    } catch (e) { return authMessage(e); }
  }, []);

  const logOut = useCallback(async () => {
    try { await signOut(getFirebase().auth); } catch {}
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ ready, configured: firebaseReady, user, signUp, logIn, resetPassword, logOut }),
    [ready, user, signUp, logIn, resetPassword, logOut]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
