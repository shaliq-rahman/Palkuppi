"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { amountDue, previewAfter, round2, takenDays } from "@/lib/calc";
import { fmtDay, fmtShort, money, plural } from "@/lib/dates";
import { Art, Icon } from "@/components/Icons";
import { WAVE } from "@/components/art";

type Choice = "full" | "half" | "other";

export default function PayPage() {
  const { state, today, pay } = useStore();
  const router = useRouter();
  const due = amountDue(state, today);
  const taken = takenDays(state, today).length;
  const [choice, setChoice] = useState<Choice>("full");
  const [other, setOther] = useState("");
  const [paidOn, setPaidOn] = useState(today);

  const half = round2(due / 2);
  const amount = choice === "full" ? due : choice === "half" ? half : Math.min(Number(other) || 0, due);
  const p = previewAfter(state, today, amount, paidOn);
  const canPay = due > 0 && p.pay > 0;

  const submit = () => {
    if (pay(amount, paidOn)) router.push("/");
  };

  const opt = (id: Choice, title: string, value: string) => (
    <label className={"opt" + (choice === id ? " on" : "")} key={id}>
      <input type="radio" name="amt" checked={choice === id} onChange={() => setChoice(id)} />
      <span className="opt-title">{title}</span>
      {id === "other" ? (
        <span className="opt-input">₹
          <input type="number" inputMode="decimal" min={0} max={due} step="0.5" placeholder="—" value={other}
            onFocus={() => setChoice("other")} onChange={(e) => { setChoice("other"); setOther(e.target.value); }} aria-label="Other amount" />
        </span>
      ) : <span className="opt-value">{value}</span>}
    </label>
  );

  return (
    <>
      <header className="head">
        <div>
          <div className="eyebrow">Settle up</div>
          <h1 className="h1">Mark Payment</h1>
        </div>
      </header>

      <section className="hero hero-pay">
        <div className="hero-glow" />
        <Art html={WAVE} className="hero-wave hero-wave-s" />
        <div className="hero-crate" aria-hidden="true"><img src="/palkuppi-bottle.png" alt="" width={34} height={66} /><img src="/palkuppi-bottle.png" alt="" width={34} height={66} /></div>
        <div className="hero-body">
          <div className="hero-label">Total due now</div>
          <div className="hero-amount hero-amount-m">{money(due)}</div>
          <div className="hero-sub">{plural(taken, "day")} × {money(state.rate)}</div>
        </div>
      </section>

      {due <= 0 ? (
        <div className="card empty"><Icon name="check" size={20} stroke={2.8} /> Nothing to pay right now. You're all settled up.</div>
      ) : (
        <>
          <fieldset className="opts">
            <legend>How much did you pay?</legend>
            <div className="card opts-card">
              {opt("full", "Full amount", money(due))}
              {opt("half", "Half", money(half))}
              {opt("other", "Other amount", "")}
            </div>
          </fieldset>

          <div className="card kv">
            <label className="kv-row" htmlFor="paidOn">
              <span className="kv-k"><Icon name="cal" size={20} stroke={1.9} />Paid on</span>
              <input id="paidOn" type="date" className="date-input" value={paidOn} max={today} onChange={(e) => e.target.value && setPaidOn(e.target.value)} />
            </label>
            <div className="kv-row"><span className="kv-k">Paying now</span><span className="kv-v">{money(p.pay)}</span></div>
            <div className="kv-row"><span className="kv-k">Balance after</span><span className="kv-v green">{money(p.after)}</span></div>
          </div>

          <div className="note-green"><Icon name="check" size={18} stroke={2.8} />
            {p.isFull && p.restart ? `Counting restarts from ${fmtShort(p.restart)}.` : "Anything left unpaid stays on your balance."}
          </div>

          <button className="btn btn-primary btn-xl" disabled={!canPay} onClick={submit}>Mark {money(p.pay)} as Paid</button>
        </>
      )}

      {state.payments.length > 0 && (
        <section className="card hist">
          <div className="card-title">Past payments</div>
          {state.payments.slice(0, 6).map((x) => (
            <div className="hist-row" key={x.id}>
              <span>{fmtDay(x.date)} · {x.kind === "full" ? "Full" : "Part"}</span><b>{money(x.amount)}</b>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
