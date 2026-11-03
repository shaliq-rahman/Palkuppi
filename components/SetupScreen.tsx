/** Shown until the Firebase keys are added to .env.local. */
export default function SetupScreen() {
  return (
    <div className="app login-app">
      <main className="login">
        <div className="login-brand">
          <img src="/palkuppi-bottle.png" alt="" className="brand-bottle" width={20} height={38} />
          <span className="brand-name">Palkuppi</span>
        </div>
        <h1 className="h1">Almost there</h1>
        <p className="muted">Connect the app to your Firebase project so people can log in and their milk records are saved online.</p>
        <section className="card setup-card">
          <ol className="setup-list">
            <li>In the Firebase console, open <b>Project settings → Your apps → Web app</b> and copy the config.</li>
            <li>In the project folder, copy <code>env.example.txt</code> to a new file named <code>.env.local</code> and paste the values.</li>
            <li>Restart <code>npm run dev</code>.</li>
          </ol>
        </section>
      </main>
    </div>
  );
}
