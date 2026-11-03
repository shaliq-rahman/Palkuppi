"use client";
import type { ReactNode } from "react";
import BottomNav from "./BottomNav";
import { useStore } from "@/lib/store";

export default function Shell({ children }: { children: ReactNode }) {
  const { ready } = useStore();
  return (
    <div className="app">
      <div className="bg-glow bg-glow-a" />
      <div className="bg-glow bg-glow-b" />
      <main className="page">{ready ? children : <div className="loading" aria-busy="true" />}</main>
      <BottomNav />
    </div>
  );
}
