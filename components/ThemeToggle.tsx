"use client";
import { Icon } from "./Icons";
import { useTheme } from "@/lib/theme";

/** One-tap switch between the Sticker and Soft themes. */
export default function ThemeToggle() {
  const [theme, setTheme] = useTheme();
  const next = theme === "sticker" ? "soft" : "sticker";
  return (
    <button type="button" className="icon-btn icon-btn-sm" onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} theme`} title={`Switch to ${next} theme`}>
      <Icon name="palette" size={22} stroke={1.9} />
    </button>
  );
}
