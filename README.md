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
