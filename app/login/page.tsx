"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { Art } from "@/components/Icons";
import { CLOUDS, FLOWERS, PASTURE } from "@/components/art";

const RESEND_SECONDS = 30;

export default function LoginPage() {
  const { signUp, logIn, sendPhoneCode, verifyPhoneCode } = useAuth();
  const [method, setMethod] = useState<"username" | "phone">("username");

  // username + password
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  // phone + OTP
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"number" | "code">("number");
  const [cooldown, setCooldown] = useState(0);

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [smsQuota, setSmsQuota] = useState(false); // today's free SMS limit is used up
  const signup = mode === "signup";

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const reset = () => { setError(null); setInfo(null); setSmsQuota(false); };
  const pickMethod = (m: "username" | "phone") => { setMethod(m); reset(); };

  const submitUsername = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    reset(); setBusy(true);
    const err = signup ? await signUp(name, username, password) : await logIn(username, password);
    setBusy(false);
    if (err) setError(err);
  };
  const switchMode = () => { setMode(signup ? "login" : "signup"); reset(); setPassword(""); };

  const sendCode = async (e?: FormEvent) => {
    e?.preventDefault();
    if (busy) return;
    reset(); setBusy(true);
    const res = await sendPhoneCode(phone);
    setBusy(false);
    if (!res.ok) { setError(res.message); setSmsQuota(Boolean(res.quota)); return; }
    setStep("code"); setCode(""); setCooldown(RESEND_SECONDS);
    setInfo("Code sent. It can take up to a minute to arrive.");
  };
  const submitCode = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    reset(); setBusy(true);
    const err = await verifyPhoneCode(code, name);
    setBusy(false);
    if (err) setError(err);
  };
  const changeNumber = () => { setStep("number"); setCode(""); reset(); };

  const useUsername = () => { setMethod("username"); setMode("login"); reset(); setStep("number"); };

  const title = method === "phone" ? "Log in with phone" : signup ? "Create account" : "Welcome back";
  const sub = method === "phone"
    ? "We'll text you a 6-digit code. New numbers get an account automatically."
    : signup ? "Set up your milk diary in a minute." : "Log in to see what you owe the milkman.";

  return (
    <div className="app login-app">
      <div className="bg-glow bg-glow-a" />
      <div className="bg-glow bg-glow-b" />
      <main className="login">
        <div className="login-brand">
          <img src="/palkuppi-bottle.png" alt="" className="brand-bottle" width={20} height={38} />
          <span className="brand-name">Palkuppi</span>
        </div>

        <div className="scene login-scene">
          <Art html={PASTURE} className="scene-pasture" />
          <Art html={CLOUDS} className="scene-clouds" />
          <Art html={FLOWERS} className="scene-flowers" />
        </div>

        <div>
          <h1 className="h1">{title}</h1>
          <p className="muted login-sub">{sub}</p>
        </div>

        <div className="method-tabs" role="group" aria-label="Log in method">
          <button type="button" className={"method-tab" + (method === "username" ? " on" : "")} aria-pressed={method === "username"} onClick={() => pickMethod("username")}>Username</button>
          <button type="button" className={"method-tab" + (method === "phone" ? " on" : "")} aria-pressed={method === "phone"} onClick={() => pickMethod("phone")}>Phone</button>
        </div>

        {method === "username" ? (
          <form className="card login-card" onSubmit={submitUsername} noValidate>
            {signup && (
              <label className="field">
                <span className="field-l">Your name</span>
                <span className="field-box"><input type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Shalique" /></span>
              </label>
            )}
            <label className="field">
              <span className="field-l">Username</span>
              <span className="field-box"><input type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="yourname" /></span>
            </label>
            <label className="field">
              <span className="field-l">Password</span>
              <span className="field-box">
                <input type={show ? "text" : "password"} autoComplete={signup ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={signup ? "At least 6 characters" : "Your password"} />
                <button type="button" className="link-btn" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"}>{show ? "Hide" : "Show"}</button>
              </span>
            </label>
            {error && <div className="form-error" role="alert">{error}</div>}
            <button type="submit" className="btn btn-primary btn-xl" disabled={busy}>{busy ? "Please wait…" : signup ? "Create account" : "Log in"}</button>
          </form>
        ) : step === "number" ? (
          <form className="card login-card" onSubmit={sendCode} noValidate>
            <label className="field">
              <span className="field-l">Your name (optional)</span>
              <span className="field-box"><input type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Shalique" /></span>
            </label>
            <label className="field">
              <span className="field-l">Mobile number</span>
              <span className="field-box"><input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" /></span>
            </label>
            <p className="login-hint">Indian numbers don't need +91. Phone codes are limited each day.</p>
            {error && <div className="form-error" role="alert">{error}</div>}
            {smsQuota && (
              <div className="quota-prompt" role="alert">
                <b>Phone login is unavailable right now.</b>
                <span>Please log in with your username and password instead. New here? Tap “Create account” under the form.</span>
                <button type="button" className="btn btn-soft btn-sm" onClick={useUsername}>Use username &amp; password</button>
              </div>
            )}
            <button type="submit" className="btn btn-primary btn-xl" disabled={busy}>{busy ? "Sending…" : "Send code"}</button>
          </form>
        ) : (
          <form className="card login-card" onSubmit={submitCode} noValidate>
            <label className="field">
              <span className="field-l">6-digit code</span>
              <span className="field-box"><input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="123456" className="otp-input" /></span>
            </label>
            {error && <div className="form-error" role="alert">{error}</div>}
            {info && !error && <div className="form-info" role="status">{info}</div>}
            <button type="submit" className="btn btn-primary btn-xl" disabled={busy || code.length !== 6}>{busy ? "Checking…" : "Verify and log in"}</button>
            <div className="otp-actions">
              <button type="button" className="link-btn" onClick={changeNumber}>Change number</button>
              <button type="button" className="link-btn" onClick={() => sendCode()} disabled={cooldown > 0 || busy}>{cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}</button>
            </div>
          </form>
        )}

        {method === "username" && (
          <p className="login-switch">
            {signup ? "Already have an account?" : "New here?"}{" "}
            <button type="button" className="link-btn" onClick={switchMode}>{signup ? "Log in" : "Create account"}</button>
          </p>
        )}
        <p className="login-note">Your records are saved to your account, so they follow you to any device.</p>
        <div id="recaptcha-container" />
      </main>
    </div>
  );
}
