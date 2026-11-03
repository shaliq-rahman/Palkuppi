"use client";
import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { StoreProvider } from "@/lib/store";
import Shell from "./Shell";

/** Only logged-in users see the app. Everyone else is sent to /login. */
export default function AuthGate({ children }: { children: ReactNode }) {
  const { ready, user } = useAuth();
  const path = usePathname();
  const router = useRouter();
  const onLogin = path === "/login";

  useEffect(() => {
    if (!ready) return;
    if (!user && !onLogin) router.replace("/login");
    if (user && onLogin) router.replace("/");
  }, [ready, user, onLogin, router]);

  if (!ready) return <div className="splash" aria-busy="true" />;
  if (!user) return onLogin ? <>{children}</> : <div className="splash" aria-busy="true" />;
  if (onLogin) return <div className="splash" aria-busy="true" />;
  return (
    <StoreProvider key={user.username} userKey={user.username}>
      <Shell>{children}</Shell>
    </StoreProvider>
  );
}
