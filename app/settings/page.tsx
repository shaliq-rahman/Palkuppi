"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Icon } from "@/components/Icons";
import DatePicker from "@/components/DatePicker";

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
        <h1 className="h1">Settings</h1>
      </header>

      <section className="card account">
        <div className="account-who">
          <span className="account-avatar" aria-hidden="true">{(user?.name || "?").slice(0, 1).toUpperCase()}</span>
          <div><div className="card-title">{user?.name}</div><div className="muted">{user?.username ? `@${user.username}` : user?.email || user?.phone}</div></div>
        </div>
        <button className="btn btn-soft btn-sm" onClick={async () => { await logOut(); router.replace("/login"); }}>Log out</button>
      </section>

      <section className="card theme-card">
        <div className="card-title">Theme</div>
        <div className="theme-row" role="group" aria-label="Theme">
          <button type="button" className={"theme-opt" + (theme === "sticker" ? " on" : "")} aria-pressed={theme === "sticker"} onClick={() => setTheme("sticker")}>Sticker</button>
          <button type="button" className={"theme-opt" + (theme === "soft" ? " on" : "")} aria-pressed={theme === "soft"} onClick={() => setTheme("soft")}>Soft</button>
        </div>
      </section>

      <section className="card form">
        <div className="field-grid">
          <label className="field">
            <span className="field-l">Daily amount (₹)</span>
            <span className="field-box"><input type="number" inputMode="decimal" min={1} value={rate} onChange={(e) => setRate(e.target.value)} /></span>
          </label>
          <div className="field">
            <span className="field-l">Counting started</span>
            <span className="field-box"><DatePicker label="Counting started on" value={start} onChange={setStart} /></span>
          </div>
        </div>
        <p className="muted settings-muted">Pickup time is 10:30 AM every day.</p>
        <button className="btn btn-primary" disabled={!valid} onClick={() => { saveSettings(Number(rate), start); router.push("/"); }}>Save</button>
      </section>

      <section className="card form danger-card">
        {confirm ? (
          <>
            <div className="card-title">Clear everything?</div>
            <p className="muted">Removes every marked day, break and payment on this device.</p>
            <div className="btn-row">
              <button className="btn btn-danger" onClick={() => { resetAll(); router.push("/"); }}>Yes, clear all</button>
              <button className="btn btn-soft" onClick={() => setConfirm(false)}>Cancel</button>
            </div>
          </>
        ) : (
          <div className="danger-row">
            <div><div className="card-title">Start over</div><div className="muted settings-muted">Clears days, breaks and payments.</div></div>
            <button className="btn btn-soft btn-sm" onClick={() => setConfirm(true)}>Clear all data</button>
          </div>
        )}
      </section>
    </>
  );
}
