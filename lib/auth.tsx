"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { hashPassword } from "./sha256";

type Account = { username: string; name: string; salt: string; hash: string };
export type User = { username: string; name: string };

const USERS_KEY = "palkuppi-users";
const SESSION_KEY = "palkuppi-session";
const LEGACY_DATA_KEY = "milk-tracker-v1";
export const dataKey = (username: string) => `milk-tracker-v1:${username}`;

type Ctx = {
  ready: boolean;
  user: User | null;
  hasAccounts: boolean;
  signUp: (name: string, username: string, password: string) => string | null;
  logIn: (username: string, password: string) => string | null;
  logOut: () => void;
};
const AuthContext = createContext<Ctx | null>(null);

const readUsers = (): Account[] => {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]"); } catch { return []; }
};
const norm = (s: string) => s.trim().toLowerCase();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [hasAccounts, setHasAccounts] = useState(false);

  useEffect(() => {
    const users = readUsers();
    setHasAccounts(users.length > 0);
    try {
      const sess = JSON.parse(localStorage.getItem(SESSION_KEY) || "null") as { username: string } | null;
      const acc = sess && users.find((u) => u.username === sess.username);
      if (acc) setUser({ username: acc.username, name: acc.name });
    } catch {}
    setReady(true);
  }, []);

  const signUp = useCallback((name: string, usernameRaw: string, password: string) => {
    const username = norm(usernameRaw);
    if (!name.trim()) return "Please enter your name.";
    if (!/^[a-z0-9._-]{3,}$/.test(username)) return "Username needs 3+ letters or numbers (no spaces).";
    if (password.length < 6) return "Password must be at least 6 characters.";
    const users = readUsers();
    if (users.some((u) => u.username === username)) return "That username is already taken.";
    const salt = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const acc: Account = { username, name: name.trim(), salt, hash: hashPassword(password, salt) };
    try {
      // The first account adopts any data saved before accounts existed.
      const legacy = localStorage.getItem(LEGACY_DATA_KEY);
      if (users.length === 0 && legacy && !localStorage.getItem(dataKey(username))) localStorage.setItem(dataKey(username), legacy);
      localStorage.setItem(USERS_KEY, JSON.stringify([...users, acc]));
      localStorage.setItem(SESSION_KEY, JSON.stringify({ username }));
    } catch { return "Could not save your account on this device."; }
    setHasAccounts(true);
    setUser({ username, name: acc.name });
    return null;
  }, []);

  const logIn = useCallback((usernameRaw: string, password: string) => {
    const username = norm(usernameRaw);
    const acc = readUsers().find((u) => u.username === username);
    if (!acc || acc.hash !== hashPassword(password, acc.salt)) return "Wrong username or password.";
    try { localStorage.setItem(SESSION_KEY, JSON.stringify({ username })); } catch {}
    setUser({ username, name: acc.name });
    return null;
  }, []);

  const logOut = useCallback(() => {
    try { localStorage.removeItem(SESSION_KEY); } catch {}
    setUser(null);
  }, []);

  const value = useMemo(() => ({ ready, user, hasAccounts, signUp, logIn, logOut }), [ready, user, hasAccounts, signUp, logIn, logOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
