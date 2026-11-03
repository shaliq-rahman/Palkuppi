"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Icon } from "@/components/Icons";

export default function SettingsPage() {
  const { state, saveSettings, resetAll } = useStore();
  const { user, logOut } = useAuth();
  const [theme, setTheme] = useTheme();
  const router = useRouter();
  const [rate, setRate] = useState(String(state.rate));
  const [start, setStart] = useState(state.startDate);
  const [confirm, setConfirm] = useState(false);
  const valid = Number(rate) > 0 && !!start;

  return (
    <>
      <header className="head">
        <div>
          <span className="brand"><img src="/palkuppi-bottle.png" alt="" className="brand-bottle" width={20} height={38} /><span className="brand-name">Palkuppi</span></span>
          <h1 className="h1">Settings</h1>
        </div>
      </header>

      <section className="card account">
        <div className="account-who">
          <span className="account-avatar" aria-hidden="true">{(user?.name || "?").slice(0, 1).toUpperCase()}</span>
          <div><div className="card-title">{user?.name}</div><div className="muted">{user?.username ? `@${user.username}` : user?.email || user?.phone}</div></div>
        </div>
        <button className="btn btn-soft btn-sm" onClick={async () => { await logOut(); router.replace("/login"); }}>Log out</button>
      </section>

      <section className="card form theme-card">
        <div className="card-title">Theme</div>
        <div className="theme-row" role="group" aria-label="Theme">
          <button type="button" className={"theme-opt" + (theme === "sticker" ? " on" : "")} aria-pressed={theme === "sticker"} onClick={() => setTheme("sticker")}>
            <span className="theme-prev theme-prev-sticker"><i /><i /><i /></span>
            <span className="theme-name">Sticker</span>
            <span className="theme-sub">Bold outlines, cow spots</span>
          </button>
          <button type="button" className={"theme-opt" + (theme === "soft" ? " on" : "")} aria-pressed={theme === "soft"} onClick={() => setTheme("soft")}>
            <span className="theme-prev theme-prev-soft"><i /><i /><i /></span>
            <span className="theme-name">Soft</span>
            <span className="theme-sub">Clean, light and minimal</span>
          </button>
        </div>
      </section>

      <section className="card form">
        <label className="field">
          <span className="field-l">Daily amount (₹)</span>
          <span className="field-box"><input type="number" inputMode="decimal" min={1} value={rate} onChange={(e) => setRate(e.target.value)} /></span>
        </label>
        <label className="field">
          <span className="field-l">Counting started on</span>
          <span className="field-box"><Icon name="cal" size={20} stroke={1.9} /><input type="date" value={start} onChange={(e) => e.target.value && setStart(e.target.value)} /></span>
        </label>
        <p className="muted">Pickup time is 10:30 AM every day.</p>
        <button className="btn btn-primary" disabled={!valid} onClick={() => { saveSettings(Number(rate), start); router.push("/"); }}>Save</button>
      </section>

      <section className="card form">
        <div className="card-title">Start over</div>
        <p className="muted">Clears every day you marked, your breaks and your payments on this device.</p>
        {confirm ? (
          <div className="btn-row">
            <button className="btn btn-danger" onClick={() => { resetAll(); router.push("/"); }}>Yes, clear everything</button>
            <button className="btn btn-soft" onClick={() => setConfirm(false)}>Cancel</button>
          </div>
        ) : (
          <button className="btn btn-soft" onClick={() => setConfirm(true)}>Clear all data</button>
        )}
      </section>
    </>
  );
}
