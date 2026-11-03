"use client";
import { useCallback, useEffect, useState } from "react";

export type Theme = "sticker" | "soft";
export const THEME_KEY = "palkuppi-theme";
export const DEFAULT_THEME: Theme = "sticker";

/** The theme lives on <html data-theme="...">; a tiny inline script in layout.tsx sets it before first paint. */
export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);

  useEffect(() => {
    const t = document.documentElement.dataset.theme;
    if (t === "soft" || t === "sticker") setThemeState(t);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem(THEME_KEY, t); } catch {}
    setThemeState(t);
  }, []);

  return [theme, setTheme];
}
