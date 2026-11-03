"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { addDays, todayISO } from "./dates";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebase } from "./firebase";
import { amountDue, previewAfter, round2 } from "./calc";

export type Mark = "taken" | "skipped";
export type Break = { id: string; from: string; to: string | null };
export type Payment = { id: string; date: string; amount: number; kind: "full" | "part" };
export type State = {
  rate: number;
  startDate: string;
  marks: Record<string, Mark>;
  breaks: Break[];
  payments: Payment[];
  /** Billing cycle: days before `start` are settled; `paid` is part-payment already made. */
  cycle: { start: string; paid: number };
};

const DEFAULT: State = {
  rate: 35,
  startDate: "2026-11-02",
  marks: {},
  breaks: [],
  payments: [],
  cycle: { start: "2026-11-02", paid: 0 },
};

type Ctx = {
  ready: boolean;
  state: State;
  today: string;
  now: Date;
  setMark: (date: string, mark: Mark | null) => void;
  setMarks: (dates: string[], mark: Mark) => void;
  addBreak: (from: string, to: string | null) => void;
  endBreak: (id: string, on: string) => void;
  removeBreak: (id: string) => void;
  pay: (amount: number, paidOn: string) => boolean;
  saveSettings: (rate: number, startDate: string) => void;
  resetAll: () => void;
  /** Set when saving to / loading from Firebase fails (for example, Firestore rules not published). */
  syncError: string | null;
};

const StoreContext = createContext<Ctx | null>(null);
const uid = () => Math.random().toString(36).slice(2, 10);

const LEGACY_KEY = "milk-tracker-v1"; // data saved on this device before accounts moved to Firebase
const cacheKey = (uid: string) => `milk-tracker-cache:${uid}`;

export function StoreProvider({ children, userKey }: { children: ReactNode; userKey: string }) {
  const uidKey = userKey;
  const [state, setState] = useState<State>(DEFAULT);
  const [ready, setReady] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [now, setNow] = useState<Date>(() => new Date());
  const stateRef = useRef<State>(DEFAULT);
  const loaded = useRef(false);        // true once the first Firestore snapshot has arrived
  const lastSynced = useRef("");       // JSON of the last state known to be in Firestore (avoids write loops)
  stateRef.current = state;

  // Load + live-sync this user's data from Firestore (users/{uid}.state).
  useEffect(() => {
    let cancelled = false;
    loaded.current = false;
    try {
      const cached = localStorage.getItem(cacheKey(uidKey));
      if (cached) setState({ ...DEFAULT, ...JSON.parse(cached) });
    } catch {}
    const { db } = getFirebase();
    const ref = doc(db, "users", uidKey);
    const unsub = onSnapshot(
      ref,
      { includeMetadataChanges: false },
      (snap) => {
        if (cancelled) return;
        setSyncError(null);
        if (snap.metadata.hasPendingWrites) return; // our own write echoing back
        const remote = snap.exists() ? (snap.data().state as Partial<State> | undefined) : undefined;
        if (remote) {
          const next = { ...DEFAULT, ...remote } as State;
          lastSynced.current = JSON.stringify(next);
          if (lastSynced.current !== JSON.stringify(stateRef.current)) setState(next);
        } else {
          // First sign-in: bring over anything saved on this device before, otherwise start fresh.
          let initial = DEFAULT;
          try { const legacy = localStorage.getItem(LEGACY_KEY); if (legacy) initial = { ...DEFAULT, ...JSON.parse(legacy) }; } catch {}
          lastSynced.current = JSON.stringify(initial); setState(initial);
          setDoc(ref, { state: initial, updatedAt: serverTimestamp() }).catch((e) => setSyncError(describe(e)));
        }
        loaded.current = true;
        setReady(true);
      },
      (err) => { if (!cancelled) { setSyncError(describe(err)); loaded.current = true; setReady(true); } }
    );
    return () => { cancelled = true; unsub(); };
  }, [uidKey]);

  // Save changes made on this device (small delay so quick taps are sent together).
  useEffect(() => {
    if (!loaded.current) return;
    const json = JSON.stringify(state);
    if (json === lastSynced.current) { setSyncError(null); return; } // already matches what is saved
    try { localStorage.setItem(cacheKey(uidKey), json); } catch {}
    const t = setTimeout(() => {
      const { db } = getFirebase();
      setDoc(doc(db, "users", uidKey), { state, updatedAt: serverTimestamp() })
        .then(() => { lastSynced.current = json; setSyncError(null); })
        .catch((e) => setSyncError(describe(e)));
    }, 500);
    return () => clearTimeout(t);
  }, [state, uidKey]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const today = todayISO();

  const setMark = useCallback((date: string, mark: Mark | null) => {
    setState((s) => {
      const marks = { ...s.marks };
      if (mark) marks[date] = mark;
      else delete marks[date];
      return { ...s, marks };
    });
  }, []);

  const setMarks = useCallback((dates: string[], mark: Mark) => {
    setState((s) => {
      const marks = { ...s.marks };
      for (const d of dates) marks[d] = mark;
      return { ...s, marks };
    });
  }, []);

  const addBreak = useCallback((from: string, to: string | null) => {
    setState((s) => ({ ...s, breaks: [...s.breaks, { id: uid(), from, to }] }));
  }, []);
  const endBreak = useCallback((id: string, on: string) => {
    setState((s) => ({ ...s, breaks: s.breaks.map((b) => (b.id === id ? { ...b, to: on } : b)) }));
  }, []);
  const removeBreak = useCallback((id: string) => {
    setState((s) => ({ ...s, breaks: s.breaks.filter((b) => b.id !== id) }));
  }, []);

  const pay = useCallback(
    (amount: number, paidOn: string) => {
      const p = previewAfter(state, today, amount, paidOn);
      if (p.pay <= 0) return false;
      setState((s) => {
        const payment: Payment = { id: uid(), date: paidOn, amount: round2(p.pay), kind: p.isFull ? "full" : "part" };
        const cycle = p.isFull ? { start: addDays(paidOn, 1), paid: 0 } : { ...s.cycle, paid: round2(s.cycle.paid + p.pay) };
        return { ...s, payments: [payment, ...s.payments], cycle };
      });
      return true;
    },
    [state, today]
  );

  const saveSettings = useCallback((rate: number, startDate: string) => {
    setState((s) => ({
      ...s,
      rate,
      startDate,
      cycle: s.payments.length === 0 ? { start: startDate, paid: 0 } : s.cycle,
    }));
  }, []);

  const resetAll = useCallback(() => setState(DEFAULT), []);

  const value = useMemo<Ctx>(
    () => ({ ready, state, today, now, setMark, setMarks, addBreak, endBreak, removeBreak, pay, saveSettings, resetAll, syncError }),
    [ready, state, today, now, setMark, setMarks, addBreak, endBreak, removeBreak, pay, saveSettings, resetAll, syncError]
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
export { amountDue };

function describe(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  if (code === "permission-denied") return "Can't save: Firestore rules don't allow this yet. Publish the rules from the README.";
  if (code === "unavailable") return "Offline. Your changes are kept and will sync when you're back online.";
  return "Couldn't sync with Firebase.";
}
