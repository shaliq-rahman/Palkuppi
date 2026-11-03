// All dates are handled as local "YYYY-MM-DD" strings.
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const parse = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (s: string, n: number) => {
  const d = parse(s);
  d.setDate(d.getDate() + n);
  return iso(d);
};

export const todayISO = () => iso(new Date());

/** Every date from a to b inclusive. */
export function eachDay(a: string, b: string): string[] {
  const out: string[] = [];
  if (a > b) return out;
  let cur = a;
  let guard = 0;
  while (cur <= b && guard++ < 4000) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

export const fmtShort = (s: string) => {
  const d = parse(s);
  return `${WD[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`;
};
export const fmtDay = (s: string) => {
  const d = parse(s);
  return `${d.getDate()} ${MON[d.getMonth()]}`;
};
export const fmtLong = (d: Date) => `${WD[d.getDay()]}, ${d.getDate()} ${MONTH_FULL[d.getMonth()]}`;
export const monthTitle = (year: number, month: number) => `${MONTH_FULL[month]} ${year}`;
export const weekdays = WD;

export const money = (n: number) => {
  const v = Math.round(n * 100) / 100;
  return "₹" + (Number.isInteger(v) ? String(v) : v.toFixed(2));
};

export const plural = (n: number, one: string, many = one + "s") => `${n} ${n === 1 ? one : many}`;
