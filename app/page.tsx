"use client";
import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { amountDue, dayStatus, takenDays, unmarkedDays, inBreak } from "@/lib/calc";
import { addDays, fmtDay, fmtLong, fmtShort, money, plural } from "@/lib/dates";
import { Art, Icon } from "@/components/Icons";
import ThemeToggle from "@/components/ThemeToggle";
import { CLOUDS, FLOWERS, PASTURE, WAVE } from "@/components/art";

const CUTOFF_MIN = 10 * 60 + 30; // 10:30 AM

function greeting(now: Date) {
  const h = now.getHours();
  return h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";
}

function cutoffText(now: Date) {
  const mins = CUTOFF_MIN - (now.getHours() * 60 + now.getMinutes());
  if (mins <= 0) return "after 10:30 AM";
  if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m left`;
  return `${mins} min left`;
}

export default function TodayPage() {
  const { state, today, now, setMark, endBreak } = useStore();
  const [pending, setPending] = useState<null | "taken" | "skipped" | "change">(null);
  const due = amountDue(state, today);
  const taken = takenDays(state, today).length;
  const status = dayStatus(state, today, today);
  const missed = unmarkedDays(state, today).length;
  const activeBreak = state.breaks.find((b) => today >= b.from && (b.to === null || today <= b.to));
  const yesterday = addDays(today, -1);
  const yStatus = dayStatus(state, yesterday, today);
  const notStarted = today < state.startDate;

  const chip = (label: string, s: string, date: string) => {
    const map: Record<string, [string, string]> = {
      taken: ["dot-green", `Taken · ${money(state.rate)}`],
      skipped: ["dot-gray", "Skipped"],
      unmarked: ["dot-yellow", "Not marked"],
      break: ["dot-violet", "On break"],
      before: ["dot-gray", "Not started"],
      future: ["dot-gray", "Upcoming"],
    };
    const [dot, text] = map[s];
    return (
      <Link href="/history" className="mini-card" key={date}>
        <span className={"dot " + dot} />
        <div>
          <div className="mini-title">{label}</div>
          <div className={"mini-sub" + (s === "taken" ? " green" : "")}>{text}</div>
        </div>
      </Link>
    );
  };

  return (
    <>
      <div className="brand-row">
        <span className="brand"><img src="/palkuppi-bottle.png" alt="" className="brand-bottle" width={20} height={38} /><span className="brand-name">Palkuppi</span></span>
        <div className="head-actions"><ThemeToggle /><Link href="/settings" className="icon-btn icon-btn-sm" aria-label="Settings"><Icon name="gear" size={22} stroke={1.9} /></Link></div>
      </div>
      <header className="head">
        <div>
          <div className="eyebrow">{fmtLong(now)}</div>
          <h1 className="h1">{greeting(now)}</h1>
        </div>
      </header>


      <div className="scene">
        <Art html={PASTURE} className="scene-pasture" />
        <Art html={CLOUDS} className="scene-clouds" />
        <Art html={FLOWERS} className="scene-flowers" />
      </div>

      <section className="hero hero-today">
        <div className="hero-glow" />
        <div className="hero-img"><img src="/palkuppi-bottle.png" alt="" width={56} height={108} /></div>
        <Art html={WAVE} className="hero-wave" />
        <Art html={FLOWERS} className="hero-flowers" />
        <div className="hero-body">
          <div className="hero-label">Amount to pay</div>
          <div className="hero-amount">{money(due)}</div>
          <div className="hero-sub">
            {plural(taken, "day")} × {money(state.rate)} · since {fmtDay(state.cycle.start > state.startDate ? state.cycle.start : state.startDate)}
            {state.cycle.paid > 0 ? ` · ${money(state.cycle.paid)} paid` : ""}
          </div>
        </div>
      </section>

      {missed > 0 && (
        <Link href="/history" className="notice">
          {plural(missed, "past day")} not marked. Tap to fix in History <Icon name="chev" size={15} stroke={2.6} />
        </Link>
      )}

      <section className="card checkin">
        {activeBreak ? (
          <>
            <div className="checkin-top">
              <div className="card-title">You're on a break</div>
              <div className="chip"><Icon name="pause" size={13} stroke={2.2} />{activeBreak.to ? `until ${fmtDay(activeBreak.to)}` : "no end date"}</div>
            </div>
            <p className="muted">Days on a break aren't counted. Back early?</p>
            <button className="btn btn-soft" onClick={() => endBreak(activeBreak.id, today)}>End break today</button>
          </>
        ) : notStarted ? (
          <p className="muted">Counting starts on {fmtShort(state.startDate)}.</p>
        ) : (
          <>
            {status === "unmarked" ? (
              pending === "taken" || pending === "skipped" ? (
                <>
                  <div className="card-title">{pending === "taken" ? "Mark today as taken?" : "Mark today as not taken?"}</div>
                  <p className="muted">{pending === "taken" ? `${money(state.rate)} will be added to what you owe.` : "Nothing will be added for today."}</p>
                  <div className="btn-row">
                    <button className="btn btn-primary" onClick={() => { setMark(today, pending); setPending(null); }}>Confirm</button>
                    <button className="btn btn-soft" onClick={() => setPending(null)}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="checkin-top">
                    <div className="card-title">Did you take milk today?</div>
                    <div className="chip"><Icon name="clock" size={13} stroke={2.2} />{cutoffText(now)}</div>
                  </div>
                  <div className="btn-row">
                    <button className="btn btn-primary" onClick={() => setPending("taken")}>
                      <Icon name="check" size={18} stroke={2.6} />Took milk
                    </button>
                    <button className="btn btn-soft" onClick={() => setPending("skipped")}>
                      <Icon name="x" size={16} stroke={2.6} />Didn't take
                    </button>
                  </div>
                </>
              )
            ) : pending === "change" ? (
              <>
                <div className="card-title">Change today's entry?</div>
                <p className="muted">This clears today's mark so you can choose again.</p>
                <div className="btn-row">
                  <button className="btn btn-primary" onClick={() => { setMark(today, null); setPending(null); }}>Yes, change</button>
                  <button className="btn btn-soft" onClick={() => setPending(null)}>Keep it</button>
                </div>
              </>
            ) : (
              <div className="marked">
                <span className={"marked-ico " + status}><Icon name={status === "taken" ? "check" : "x"} size={22} stroke={2.8} /></span>
                <div className="marked-text">
                  <b>{status === "taken" ? "Marked as taken" : "Marked as not taken"}</b>
                  <span>{status === "taken" ? `${money(state.rate)} added for today` : "Nothing added for today"}</span>
                </div>
                <button className="link-btn" onClick={() => setPending("change")}>Change</button>
              </div>
            )}
          </>
        )}
      </section>

      <Link href="/break" className="row-link">
        <span className="row-ico"><Icon name="cal" size={17} stroke={1.9} /></span>
        <span className="row-text">Going away? Add a break</span>
        <Icon name="chev" size={15} stroke={2.6} />
      </Link>

      <div className="mini-row">
        {chip("Today", dayStatus(state, today, today), today)}
        {yesterday >= state.startDate || inBreak(state, yesterday) ? chip(fmtShort(yesterday), yStatus, yesterday) : null}
      </div>
    </>
  );
}
