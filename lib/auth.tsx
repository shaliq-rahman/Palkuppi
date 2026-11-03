"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  createUserWithEmailAndPassword, onAuthStateChanged, RecaptchaVerifier, signInWithEmailAndPassword,
  signInWithPhoneNumber, signOut, updateProfile, type ConfirmationResult, type User as FirebaseUser,
} from "firebase/auth";
import { firebaseReady, getFirebase } from "./firebase";

export type User = { uid: string; email: string; phone: string; username: string; name: string };

/** Result of asking Firebase to text a code. `quota` means today's free SMS limit is used up. */
export type SendCodeResult = { ok: true } | { ok: false; message: string; quota?: boolean };

type Ctx = {
  ready: boolean;
  configured: boolean;
  user: User | null;
  signUp: (name: string, username: string, password: string) => Promise<string | null>;
  /** `identifier` is a username (or, for older accounts, a full email address). */
  logIn: (identifier: string, password: string) => Promise<string | null>;
  /** Phone (SMS) login: send a 6-digit code, then confirm it. */
  sendPhoneCode: (phone: string) => Promise<SendCodeResult>;
  verifyPhoneCode: (code: string, name: string) => Promise<string | null>;
  logOut: () => Promise<void>;
};
const AuthContext = createContext<Ctx | null>(null);

// Firebase signs in with email + password, so a username is stored as a hidden address on this domain.
// No email is ever sent to it; people only see "username" and "password".
export const USERNAME_DOMAIN = "palkuppi.app";
const usernameToEmail = (username: string) => `${username.trim().toLowerCase()}@${USERNAME_DOMAIN}`;
const emailToUsername = (email: string) => (email.toLowerCase().endsWith("@" + USERNAME_DOMAIN) ? email.slice(0, -(USERNAME_DOMAIN.length + 1)) : "");
export const validUsername = (u: string) => /^[a-z0-9._-]{3,20}$/.test(u.trim().toLowerCase());

const toUser = (u: FirebaseUser): User => {
  const username = emailToUsername(u.email ?? "");
  return {
    uid: u.uid,
    email: username ? "" : u.email ?? "",
    phone: u.phoneNumber ?? "",
    username,
    name: u.displayName || username || (u.email ?? "").split("@")[0] || "Me",
  };
};

/** "98765 43210", "09876543210", "+91 98765 43210" -> "+919876543210". Returns null if it can't be a mobile number. */
export function normalizePhone(raw: string): string | null {
  const t = raw.replace(/[\s()-]/g, "");
  if (/^\+[1-9]\d{7,14}$/.test(t)) return t;
  if (/^0?[6-9]\d{9}$/.test(t)) return "+91" + t.slice(-10);
  if (/^91[6-9]\d{9}$/.test(t)) return "+" + t;
  return null;
}

/** Turn Firebase error codes into plain sentences. */
export function authMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/invalid-email": return "Usernames can only use letters, numbers, dots, dashes and underscores.";
    case "auth/missing-password": return "Please enter your password.";
    case "auth/weak-password": return "Password must be at least 6 characters.";
    case "auth/email-already-in-use": return "That username is taken. Pick another, or log in.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found": return "Wrong username or password.";
    case "auth/network-request-failed": return "No connection. Check your internet and try again.";
    case "auth/operation-not-allowed": return "This sign-in method isn't enabled in Firebase yet. Username login needs the Email/Password provider; for phone, also allow India under Authentication > Settings > SMS region policy.";
    case "auth/invalid-phone-number":
    case "auth/missing-phone-number": return "That mobile number doesn't look right.";
    case "auth/quota-exceeded": return "Today's free SMS limit is used up.";
    case "auth/too-many-requests": return "Too many attempts from this device. Wait a while and try again.";
    case "auth/invalid-verification-code":
    case "auth/missing-verification-code": return "That code is wrong. Check the SMS and try again.";
    case "auth/code-expired": return "That code has expired. Request a new one.";
    case "auth/captcha-check-failed": return "Security check failed. Refresh the page and try again.";
    case "auth/billing-not-enabled": return "SMS isn't available on this Firebase plan yet.";
    default: return "Something went wrong. Please try again.";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!firebaseReady);
  const [user, setUser] = useState<User | null>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmRef = useRef<ConfirmationResult | null>(null);

  useEffect(() => {
    if (!firebaseReady) return;
    const { auth } = getFirebase();
    return onAuthStateChanged(auth, (u) => {
      setUser(u ? toUser(u) : null);
      setReady(true);
    });
  }, []);

  const signUp = useCallback(async (name: string, username: string, password: string) => {
    if (!name.trim()) return "Please enter your name.";
    if (!validUsername(username)) return "Username needs 3-20 letters, numbers, dots, dashes or underscores (no spaces).";
    try {
      const { auth } = getFirebase();
      const cred = await createUserWithEmailAndPassword(auth, usernameToEmail(username), password);
      await updateProfile(cred.user, { displayName: name.trim() });
      setUser(toUser({ ...cred.user, displayName: name.trim() } as FirebaseUser));
      return null;
    } catch (e) { return authMessage(e); }
  }, []);

  const logIn = useCallback(async (identifier: string, password: string) => {
    const id = identifier.trim();
    if (!id) return "Enter your username.";
    try {
      const { auth } = getFirebase();
      await signInWithEmailAndPassword(auth, id.includes("@") ? id : usernameToEmail(id), password);
      return null;
    } catch (e) { return authMessage(e); }
  }, []);

  const sendPhoneCode = useCallback(async (phoneRaw: string): Promise<SendCodeResult> => {
    const phone = normalizePhone(phoneRaw);
    if (!phone) return { ok: false, message: "Enter a valid mobile number, like 98765 43210." };
    try {
      const { auth } = getFirebase();
      // reCAPTCHA tokens are single use, so a fresh invisible verifier is made for every send.
      verifierRef.current = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
      confirmRef.current = await signInWithPhoneNumber(auth, phone, verifierRef.current);
      return { ok: true };
    } catch (e) {
      const code = (e as { code?: string })?.code ?? "";
      // The free plan allows 10 SMS a day. When it runs out, the login page offers username + password instead.
      return { ok: false, message: authMessage(e), quota: code === "auth/quota-exceeded" || code === "auth/too-many-requests" };
    } finally { try { verifierRef.current?.clear(); } catch {} verifierRef.current = null; }
  }, []);

  const verifyPhoneCode = useCallback(async (code: string, name: string) => {
    if (!confirmRef.current) return "Request a code first.";
    if (!/^\d{6}$/.test(code.trim())) return "Enter the 6-digit code from the SMS.";
    try {
      const cred = await confirmRef.current.confirm(code.trim());
      let display = cred.user.displayName;
      if (name.trim() && !display) { await updateProfile(cred.user, { displayName: name.trim() }); display = name.trim(); }
      confirmRef.current = null;
      setUser(toUser({ ...cred.user, displayName: display } as FirebaseUser));
      return null;
    } catch (e) { return authMessage(e); }
  }, []);

  const logOut = useCallback(async () => {
    try { await signOut(getFirebase().auth); } catch {}
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ ready, configured: firebaseReady, user, signUp, logIn, sendPhoneCode, verifyPhoneCode, logOut }),
    [ready, user, signUp, logIn, sendPhoneCode, verifyPhoneCode, logOut]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
