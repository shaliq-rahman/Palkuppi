"use client";
import type { ReactNode } from "react";
import BottomNav from "./BottomNav";
import { useStore } from "@/lib/store";

export default function Shell({ children }: { children: ReactNode }) {
  const { ready, syncError } = useStore();
  return (
    <div className="app">
      <div className="bg-glow bg-glow-a" />
      <div className="bg-glow bg-glow-b" />
      {syncError && <div className="sync-banner" role="status">{syncError}</div>}
      <main className="page">{ready ? children : <div className="loading" aria-busy="true" />}</main>
      <BottomNav />
    </div>
  );
}
