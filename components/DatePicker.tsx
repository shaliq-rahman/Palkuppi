"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { fmtDate, fmtLong, iso, monthsShort, parse } from "@/lib/dates";

const ITEM = 44; // wheel row height in px (keep in sync with --dp-item in globals.css)

type WheelProps = {
  items: string[];
  index: number;
  onChange: (i: number) => void;
  label: string;
  isDisabled?: (i: number) => boolean;
  flex?: number;
};

/** One scroll-snapping column, like an iOS UIPickerView wheel. */
function Wheel({ items, index, onChange, label, isDisabled, flex = 1 }: WheelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const first = useRef(true);

  // Keep the scroll position in step with the selected index (instant the first time, smooth after).
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const top = index * ITEM;
    if (Math.abs(el.scrollTop - top) < 1) { first.current = false; return; }
    el.scrollTo({ top, behavior: first.current ? "auto" : "smooth" });
    first.current = false;
  }, [index, items.length]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onScroll = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const i = Math.max(0, Math.min(items.length - 1, Math.round(el.scrollTop / ITEM)));
      if (i !== index) onChange(i);
    }, 90);
  };

  const onKey = (e: React.KeyboardEvent) => {
    const step = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : e.key === "PageUp" ? -5 : e.key === "PageDown" ? 5 : 0;
    if (!step) return;
    e.preventDefault();
    onChange(Math.max(0, Math.min(items.length - 1, index + step)));
  };

  return (
    <div
      ref={ref}
      className="dp-wheel"
      style={{ flex }}
      role="spinbutton"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={1}
      aria-valuemax={items.length}
      aria-valuenow={index + 1}
      aria-valuetext={items[index]}
      onScroll={onScroll}
      onKeyDown={onKey}
    >
      {items.map((t, i) => (
        <div
          key={t + i}
          className={"dp-item" + (i === index ? " is-sel" : "") + (isDisabled?.(i) ? " is-off" : "")}
          aria-hidden="true"
          onClick={() => onChange(i)}
        >
          {t}
        </div>
      ))}
    </div>
  );
}

const dim = (y: number, m: number) => new Date(y, m + 1, 0).getDate();

type Props = {
  value: string;
  onChange: (v: string) => void;
  label: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  className?: string;
};

/** Tap-to-open iOS-style date wheel sheet. Dates are "YYYY-MM-DD" strings. */
export default function DatePicker({ value, onChange, label, min, max, disabled, className }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const trigger = useRef<HTMLButtonElement>(null);
  const sheet = useRef<HTMLDivElement>(null);

  const clamp = useCallback((s: string) => (min && s < min ? min : max && s > max ? max : s), [min, max]);

  const openSheet = () => { setDraft(clamp(value)); setOpen(true); };
  const close = useCallback(() => { setOpen(false); trigger.current?.focus(); }, []);
  const commit = () => { if (draft !== value) onChange(draft); close(); };

  // Focus the sheet when it opens, close on Escape, keep Tab inside it.
  useEffect(() => {
    if (!open) return;
    sheet.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key !== "Tab" || !sheet.current) return;
      const f = Array.from(sheet.current.querySelectorAll<HTMLElement>("button, [tabindex='0']"));
      if (!f.length) return;
      const a = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (a === f[0] || a === sheet.current)) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && a === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  const d = parse(draft);
  const y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
  const cy = parse(value).getFullYear();
  const y0 = min ? parse(min).getFullYear() : Math.min(cy, y) - 5;
  const y1 = max ? parse(max).getFullYear() : Math.max(cy, y) + 5;
  const years = Array.from({ length: y1 - y0 + 1 }, (_, i) => String(y0 + i));
  const days = Array.from({ length: dim(y, m) }, (_, i) => String(i + 1));

  const set = (ny: number, nm: number, nd: number) => {
    const safe = Math.min(nd, dim(ny, nm));
    setDraft(clamp(iso(new Date(ny, nm, safe))));
  };
  const outOfRange = (s: string) => Boolean((min && s < min) || (max && s > max));
  const dayOff = (i: number) => outOfRange(iso(new Date(y, m, i + 1)));
  const monthOff = (i: number) => {
    const first = iso(new Date(y, i, 1)), last = iso(new Date(y, i, dim(y, i)));
    return Boolean((min && last < min) || (max && first > max));
  };

  return (
    <>
      <button type="button" ref={trigger} className={"dp-trigger" + (className ? " " + className : "")} onClick={openSheet} disabled={disabled}
        aria-haspopup="dialog" aria-label={`${label}: ${fmtDate(value)}. Change`}>
        {fmtDate(value)}
      </button>
      {open && createPortal(
        <div className="dp-root">
          <div className="dp-backdrop" onClick={close} />
          <div className="dp-sheet" ref={sheet} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>
            <div className="dp-bar">
              <button type="button" className="dp-btn" onClick={close}>Cancel</button>
              <div className="dp-title">{label}</div>
              <button type="button" className="dp-btn dp-done" onClick={commit}>Done</button>
            </div>
            <div className="dp-live" aria-live="polite">{fmtLong(d)}, {y}</div>
            <div className="dp-wheels">
              <div className="dp-band" aria-hidden="true" />
              <Wheel label="Day" items={days} index={day - 1} onChange={(i) => set(y, m, i + 1)} isDisabled={dayOff} flex={0.8} />
              <Wheel label="Month" items={monthsShort} index={m} onChange={(i) => set(y, i, day)} isDisabled={monthOff} flex={1.1} />
              <Wheel label="Year" items={years} index={y - y0} onChange={(i) => set(y0 + i, m, day)} flex={1} />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
