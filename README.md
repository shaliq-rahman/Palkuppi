# Palkuppi

Track the milk you take every day and what you owe the milkman. Built with Next.js (App Router) and TypeScript. Data is stored on the device (localStorage), so there is no backend to set up.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
```

Production: `npm run build && npm start`.

## How it works

- Daily amount is **₹35**, counting from **2 Nov 2026** (change both in Settings).
- Open the app: the big card shows the total to pay. Mark **Took milk** or **Didn't take** for today (pickup by 10:30 AM). Fix any past day in **History**.
- **Pay**: Full, Half or any amount. A full payment settles everything and counting restarts from the **next day**; a part payment lowers the balance.
- **Break**: pick From and Last day (or no end date). Break days are not counted and need no marking.

## Structure

```
app/            pages: / (Today), /history, /pay, /break, /settings
components/     BottomNav, Shell, Icons, art (illustrations)
lib/            dates.ts, calc.ts (totals, billing cycle), store.tsx (state + localStorage)
public/         milk images
```

## Firebase setup (login + saving records online)

1. Firebase console -> **Project settings -> Your apps -> Web app** -> copy the config.
2. Copy `env.example.txt` to `.env.local` and paste the six values. Restart `npm run dev`.
3. **Authentication -> Sign-in method -> Email/Password** must be enabled.
4. **Firestore Database -> Rules**: paste the contents of `firestore.rules` and Publish.
   Each person can then read and write only their own record (`users/{uid}`).

Never put a service-account / Admin SDK key (`*-admin-sdk*.json`) in this app or in Git; the website only needs the web config above.


## Deploying (for example on Vercel)

1. Push the project to GitHub (`node_modules`, `.next` and all `.env*` files are git-ignored).
2. Import the repo in Vercel. Framework: Next.js (auto-detected).
3. **Project Settings -> Environment Variables**: add the six `NEXT_PUBLIC_FIREBASE_*` names from `.env.production` with your values (all environments). Redeploy.
4. **Firebase console -> Authentication -> Settings -> Authorized domains**: add your deployed domain (for example `your-app.vercel.app`). Without this, login fails on the live site.
5. Make sure the Firestore rules from `firestore.rules` are published.
