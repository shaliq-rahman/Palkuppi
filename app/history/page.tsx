"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { dayStatus } from "@/lib/calc";
import { fmtShort, iso, monthTitle, money, parse, weekdays } from "@/lib/dates";
import { Icon } from "@/components/Icons";

export default function HistoryPage() {
  const { state, today, setMark, setMarks } = useStore();
  const t = parse(today);
  const [ym, setYm] = useState({ y: t.getFullYear(), m: t.getMonth() });
  const [sel, setSel] = useState(today);
  const [confirm, setConfirm] = useState(false);

  const first = new Date(ym.y, ym.m, 1);
  const count = new Date(ym.y, ym.m + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(null);
  for (let d = 1; d <= count; d++) cells.push(iso(new Date(ym.y, ym.m, d)));

  const monthDays = cells.filter(Boolean) as string[];
  const takenCount = monthDays.filter((d) => dayStatus(state, d, today) === "taken").length;
  const paid = state.payments.filter((p) => p.date.startsWith(`${ym.y}-${String(ym.m + 1).padStart(2, "0")}`)).reduce((a, p) => a + p.amount, 0);

  const shift = (n: number) => { setConfirm(false); setYm((v) => { const d = new Date(v.y, v.m + n, 1); return { y: d.getFullYear(), m: d.getMonth() }; }); };
  // Days that can be bulk-marked: counted days up to today that have no mark yet (breaks, skipped days and future days are left alone).
  const toMark = monthDays.filter((d) => dayStatus(state, d, today) === "unmarked");
  const selStatus = dayStatus(state, sel, today);
  const editable = selStatus === "taken" || selStatus === "skipped" || selStatus === "unmarked" || (selStatus === "future" && false);

  const labels: Record<string, string> = {
    taken: `Taken · ${money(state.rate)}`, skipped: "Not taken", unmarked: "Not marked", break: "On a break",
    before: "Before counting started", future: "Upcoming",
  };

  return (
    <div className="fit">
      <header className="head">
        <div>
          <div className="eyebrow">Your milk days</div>
          <h1 className="h1">History</h1>
        </div>
      </header>

      <section className="card cal">
        <div className="cal-head">
          <button className="round-btn" onClick={() => shift(-1)} aria-label="Previous month"><Icon name="left" size={20} stroke={2.6} /></button>
          <div className="cal-title">{monthTitle(ym.y, ym.m)}</div>
          <button className="round-btn" onClick={() => shift(1)} aria-label="Next month"><Icon name="right" size={20} stroke={2.6} /></button>
        </div>
        <div className="cal-grid cal-wd">{weekdays.map((w) => <div key={w}>{w}</div>)}</div>
        <div className="cal-grid cal-days">
          {cells.map((d, i) => {
            if (!d) return <div key={"e" + i} />;
            const s = dayStatus(state, d, today);
            return (
              <button key={d} onClick={() => setSel(d)} aria-label={`${fmtShort(d)}, ${labels[s]}`} aria-pressed={sel === d}
                className={`day day-${s}` + (d === today ? " day-today" : "") + (sel === d ? " day-sel" : "")}>
                {Number(d.slice(8))}
              </button>
            );
          })}
        </div>
      </section>

      <div className="legend">
        <span><i className="sw sw-taken" />Taken</span>
        <span><i className="sw sw-skipped" />Not taken</span>
        <span><i className="sw sw-break" />Break</span>
        <span><i className="sw sw-today" />Today</span>
      </div>

      <section className="card detail">
        <div className="detail-top">
          <div className="card-title">{fmtShort(sel)}{sel === today ? " · Today" : ""}</div>
          <div className={"detail-status s-" + selStatus}>{labels[selStatus]}</div>
        </div>
        {editable && (
          <div className="btn-row">
            <button className={"btn btn-primary btn-sm" + (selStatus === "taken" ? " is-on" : "")} onClick={() => setMark(sel, "taken")}>Taken</button>
            <button className={"btn btn-soft btn-sm" + (selStatus === "skipped" ? " is-on" : "")} onClick={() => setMark(sel, "skipped")}>Not taken</button>
            {selStatus !== "unmarked" && <button className="btn btn-ghost btn-sm" onClick={() => setMark(sel, null)}>Clear</button>}
          </div>
        )}
      </section>

      <div className="month-bar">
        {confirm ? (
          <>
            <div className="mb-text"><b>Mark {toMark.length} {toMark.length === 1 ? "day" : "days"} as taken?</b><span>Skipped days and breaks stay as they are.</span></div>
            <div className="mb-actions">
              <button className="btn btn-primary btn-xs" onClick={() => { setMarks(toMark, "taken"); setConfirm(false); }}>Yes</button>
              <button className="btn btn-soft btn-xs" onClick={() => setConfirm(false)}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-text"><b>{takenCount} {takenCount === 1 ? "day" : "days"} taken · {money(takenCount * state.rate)}</b><span>Paid {money(paid)} this month</span></div>
            <button className="btn btn-primary btn-xs" disabled={toMark.length === 0} onClick={() => setConfirm(true)}>
              <Icon name="check" size={15} stroke={2.8} />{toMark.length === 0 ? "All marked" : "Mark all"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
