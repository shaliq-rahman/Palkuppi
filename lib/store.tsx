"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { addDays, todayISO } from "./dates";
import { dataKey } from "./auth";
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
};

const StoreContext = createContext<Ctx | null>(null);
const uid = () => Math.random().toString(36).slice(2, 10);

export function StoreProvider({ children, userKey }: { children: ReactNode; userKey: string }) {
  const KEY = dataKey(userKey);
  const [state, setState] = useState<State>(DEFAULT);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...DEFAULT, ...JSON.parse(raw) });
    } catch {}
    setReady(true);
  }, [KEY]);

  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
      } catch {}
    }
  }, [state, ready, KEY]);

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
    () => ({ ready, state, today, now, setMark, setMarks, addBreak, endBreak, removeBreak, pay, saveSettings, resetAll }),
    [ready, state, today, now, setMark, setMarks, addBreak, endBreak, removeBreak, pay, saveSettings, resetAll]
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
export { amountDue };
