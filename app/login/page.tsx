"use client";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { Art } from "@/components/Icons";
import { CLOUDS, FLOWERS, PASTURE } from "@/components/art";

export default function LoginPage() {
  const { signUp, logIn, resetPassword } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const signup = mode === "signup";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null); setInfo(null); setBusy(true);
    const err = signup ? await signUp(name, email, password) : await logIn(email, password);
    setBusy(false);
    if (err) setError(err);
  };
  const forgot = async () => {
    setError(null); setInfo(null);
    const err = await resetPassword(email);
    if (err) setError(err); else setInfo("Password reset email sent. Check your inbox.");
  };
  const switchMode = () => { setMode(signup ? "login" : "signup"); setError(null); setInfo(null); setPassword(""); };

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
          <h1 className="h1">{signup ? "Create account" : "Welcome back"}</h1>
          <p className="muted login-sub">{signup ? "Set up your milk diary in a minute." : "Log in to see what you owe the milkman."}</p>
        </div>

        <form className="card login-card" onSubmit={submit} noValidate>
          {signup && (
            <label className="field">
              <span className="field-l">Your name</span>
              <span className="field-box"><input type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Shalique" /></span>
            </label>
          )}
          <label className="field">
            <span className="field-l">Email</span>
            <span className="field-box"><input type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></span>
          </label>
          <label className="field">
            <span className="field-l">Password</span>
            <span className="field-box">
              <input type={show ? "text" : "password"} autoComplete={signup ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={signup ? "At least 6 characters" : "Your password"} />
              <button type="button" className="link-btn" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"}>{show ? "Hide" : "Show"}</button>
            </span>
          </label>
          {error && <div className="form-error" role="alert">{error}</div>}
          {info && <div className="form-info" role="status">{info}</div>}
          {!signup && <button type="button" className="link-btn forgot" onClick={forgot}>Forgot password?</button>}
          <button type="submit" className="btn btn-primary btn-xl" disabled={busy}>{busy ? "Please wait…" : signup ? "Create account" : "Log in"}</button>
        </form>

        <p className="login-switch">
          {signup ? "Already have an account?" : "New here?"}{" "}
          <button type="button" className="link-btn" onClick={switchMode}>{signup ? "Log in" : "Create account"}</button>
        </p>
        <p className="login-note">Your records are saved to your account, so they follow you to any device.</p>
      </main>
    </div>
  );
}
