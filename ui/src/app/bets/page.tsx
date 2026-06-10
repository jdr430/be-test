"use client";
import { useEffect, useState } from "react";
import { api, Bet } from "@/lib/api";
import { getUserId } from "@/lib/auth";

type Filter = "ALL" | "PENDING" | "WON" | "LOST";

export default function BetsPage() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("ALL");

  useEffect(() => {
    const userId = getUserId();
    if (!userId) { setErr("Log in first."); return; }
    async function load() {
      try { setBets(await api.bets(userId!, 50)); }
      catch (e) { setErr(String(e)); }
    }
    load();
    const hasPending = bets.some((b) => b.status === "PENDING");
    const t = setInterval(load, hasPending ? 5000 : 30000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = filter === "ALL" ? bets : bets.filter((b) => b.status === filter);

  return (
    <div>
      <h1>My Bets</h1>
      {err && <div className="card" style={{ borderColor: "#5c1f1f" }}><p style={{ color: "#f5a0a0", margin: 0 }}>{err}</p></div>}
      <div className="row" style={{ marginBottom: 12 }}>
        {(["ALL","PENDING","WON","LOST"] as Filter[]).map((f) => (
          <button key={f} className={`btn ${filter === f ? "btn-primary" : ""}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>
      {filtered.length === 0 && <div className="empty-state">No bets to show.</div>}
      {filtered.length > 0 && (
        <table>
          <thead>
            <tr><th>Selection</th><th>Market</th><th>Stake</th><th>Odds</th><th>Status</th><th>Payout</th><th>Placed</th></tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id}>
                <td>{b.selection}</td>
                <td className="muted">{b.market}</td>
                <td>{b.stake.toFixed(2)}</td>
                <td>{b.odds.toFixed(2)}</td>
                <td>
                  <span className={`pill ${b.status === "WON" ? "win" : b.status === "LOST" ? "lost" : "pending"}`}>{b.status}</span>
                </td>
                <td style={{ color: b.payout > 0 ? "#36d399" : "#8a8aa0", fontWeight: 600 }}>
                  {b.payout > 0 ? b.payout.toFixed(2) : "—"}
                </td>
                <td className="muted">{new Date(b.placedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
