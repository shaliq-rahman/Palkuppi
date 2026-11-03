import { addDays, eachDay } from "./dates";
import type { State } from "./store";

export type DayStatus = "before" | "future" | "break" | "taken" | "skipped" | "unmarked";

export function inBreak(state: State, date: string): boolean {
  return state.breaks.some((b) => date >= b.from && (b.to === null || date <= b.to));
}

export function dayStatus(state: State, date: string, today: string): DayStatus {
  if (date < state.startDate) return "before";
  if (inBreak(state, date)) return "break";
  const mark = state.marks[date];
  if (mark) return mark;
  if (date > today) return "future";
  return "unmarked";
}

/** Days the user took milk in the current billing cycle (breaks never count). */
export function takenDays(state: State, today: string, cycleStart = state.cycle.start): string[] {
  const from = cycleStart > state.startDate ? cycleStart : state.startDate;
  return eachDay(from, today).filter((d) => !inBreak(state, d) && state.marks[d] === "taken");
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function amountDue(state: State, today: string): number {
  const gross = takenDays(state, today).length * state.rate;
  return Math.max(0, round2(gross - state.cycle.paid));
}

/** Past days (before today) that were neither marked nor on a break. */
export function unmarkedDays(state: State, today: string): string[] {
  return eachDay(state.startDate, addDays(today, -1)).filter((d) => dayStatus(state, d, today) === "unmarked");
}

/** What the balance would be after paying `amount` on `paidOn`. */
export function previewAfter(state: State, today: string, amount: number, paidOn: string) {
  const due = amountDue(state, today);
  const pay = Math.min(Math.max(amount, 0), due);
  const isFull = pay > 0 && pay >= due - 0.001;
  if (isFull) {
    const restart = addDays(paidOn, 1);
    const after = Math.max(0, round2(takenDays(state, today, restart).length * state.rate));
    return { pay, isFull, restart, after };
  }
  return { pay, isFull, restart: null as string | null, after: round2(due - pay) };
}
