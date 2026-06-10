"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { clearSession, getUserId } from "@/lib/auth";

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [balance, setBalance] = useState<string>("—");
  const [currency, setCurrency] = useState<string>("");
  const [name, setName] = useState<string>("");

  useEffect(() => {
    const userId = getUserId();
    if (!userId) return;
    let cancelled = false;
    async function load() {
      try {
        const [w, me] = await Promise.all([api.wallet(userId!), api.me().catch(() => null)]);
        if (cancelled) return;
        setBalance(w.balance.toFixed(2));
        setCurrency(w.currency);
        if (me) setName(me.displayName);
      } catch {
        if (!cancelled) setBalance("—");
      }
    }
    load();
    const t = setInterval(load, 10000);
    return () => { cancelled = true; clearInterval(t); };
  }, [pathname]);

  function logout() {
    clearSession();
    router.push("/login");
  }

  const link = (href: string, label: string) => (
    <Link href={href} className={`link ${pathname?.startsWith(href) ? "active" : ""}`}>{label}</Link>
  );

  return (
    <nav className="topnav">
      <div className="brand">razed<span className="accent">.</span></div>
      <div className="links">
        {link("/sports", "Sports")}
        {link("/bets", "My Bets")}
        {link("/wallet", "Wallet")}
        {link("/notifications", "Notifications")}
      </div>
      <div className="balance-pill">
        <span>Balance</span>
        <strong>{balance} {currency}</strong>
      </div>
      {getUserId() ? (
        <button className="btn-logout" onClick={logout}>Logout {name ? `(${name.split(" ")[0]})` : ""}</button>
      ) : (
        <Link className="btn-logout" href="/login">Login</Link>
      )}
    </nav>
  );
}
