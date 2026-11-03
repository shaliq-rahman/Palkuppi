"use client";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { Art } from "@/components/Icons";
import { CLOUDS, FLOWERS, PASTURE } from "@/components/art";

export default function LoginPage() {
  const { hasAccounts, signUp, logIn } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">(hasAccounts ? "login" : "signup");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signup = mode === "signup";

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(signup ? signUp(name, username, password) : logIn(username, password));
  };
  const switchMode = () => { setMode(signup ? "login" : "signup"); setError(null); setPassword(""); };

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
          <button type="submit" className="btn btn-primary btn-xl">{signup ? "Create account" : "Log in"}</button>
        </form>

        <p className="login-switch">
          {signup ? "Already have an account?" : "New here?"}{" "}
          <button type="button" className="link-btn" onClick={switchMode}>{signup ? "Log in" : "Create account"}</button>
        </p>
        <p className="login-note">Your records stay on this device.</p>
      </main>
    </div>
  );
}
