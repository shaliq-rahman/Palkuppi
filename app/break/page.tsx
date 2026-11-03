"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { addDays, eachDay, fmtShort, money, plural } from "@/lib/dates";
import { Art, Icon } from "@/components/Icons";
import { CASE } from "@/components/art";

export default function BreakPage() {
  const { state, today, addBreak, endBreak, removeBreak } = useStore();
  const [from, setFrom] = useState(addDays(today, 1));
  const [to, setTo] = useState(addDays(today, 5));
  const [open, setOpen] = useState(false);

  const days = open ? 0 : eachDay(from, to).length;
  const valid = open ? !!from : !!from && !!to && to >= from;
  const save = () => {
    if (!valid) return;
    addBreak(from, open ? null : to);
  };
  const upcoming = [...state.breaks].sort((a, b) => b.from.localeCompare(a.from));

  return (
    <div className="fit">
      <header className="head">
        <div>
          <div className="eyebrow">Going away?</div>
          <h1 className="h1">Add a break</h1>
        </div>
        <div className="head-tile"><Art html={CASE} /></div>
      </header>

      <section className="card form">
        <p className="muted">No milk during a break. Those days aren't counted.</p>
        <label className="field">
          <span className="field-l">From</span>
          <span className="field-box"><Icon name="cal" size={20} stroke={1.9} /><input type="date" value={from} onChange={(e) => e.target.value && setFrom(e.target.value)} /></span>
        </label>
        <label className={"field" + (open ? " off" : "")}>
          <span className="field-l">Last day</span>
          <span className="field-box"><Icon name="cal" size={20} stroke={1.9} /><input type="date" value={to} min={from} disabled={open} onChange={(e) => e.target.value && setTo(e.target.value)} /></span>
        </label>
        <label className="check">
          <input type="checkbox" checked={open} onChange={(e) => setOpen(e.target.checked)} />
          I don't know the end date yet
        </label>
      </section>

      <div className="save-row">
        <div>
          <div className="save-l">{open ? "Until you end it" : plural(days, "day") + " not counted"}</div>
          {!open && valid && <div className="save-s">{fmtShort(from)} to {fmtShort(to)}</div>}
        </div>
        {!open && valid && <div className="save-v">Saves {money(days * state.rate)}</div>}
      </div>

      <button className="btn btn-primary btn-xl" disabled={!valid} onClick={save}>Save Break</button>

      {upcoming.length > 0 && (
        <section className="card hist">
          <div className="card-title">Your breaks</div>
          {upcoming.slice(0, 2).map((b) => {
            const active = today >= b.from && (b.to === null || today <= b.to);
            return (
              <div className="hist-row" key={b.id}>
                <span>{fmtShort(b.from)} → {b.to ? fmtShort(b.to) : "open"}{active ? " · now" : ""}</span>
                <span className="hist-actions">
                  {active && <button className="link-btn" onClick={() => endBreak(b.id, today)}>End today</button>}
                  <button className="icon-mini" aria-label="Delete break" onClick={() => removeBreak(b.id)}><Icon name="trash" size={16} /></button>
                </span>
              </div>
            );
          })}
          {upcoming.length > 2 && <div className="hist-more">+{upcoming.length - 2} more</div>}
        </section>
      )}
    </div>
  );
}
