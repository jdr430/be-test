"use client";
import { useEffect, useState } from "react";
import { api, Wallet } from "@/lib/api";
import { getUserId } from "@/lib/auth";

export default function WalletPage() {
  const [data, setData] = useState<Wallet | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const userId = getUserId();
    if (!userId) { setErr("Log in first."); return; }
    api.wallet(userId).then(setData).catch((e) => setErr(String(e)));
  }, []);

  return (
    <div>
      <h1>Wallet</h1>
      {err && <div className="card" style={{ borderColor: "#5c1f1f" }}><p style={{ color: "#f5a0a0", margin: 0 }}>{err}</p></div>}
      {data && (
        <>
          <div className="card" style={{ background: "linear-gradient(135deg, #15151c, #1a2a22)" }}>
            <div className="muted" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>Available balance</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: "#36d399", marginTop: 4 }}>
              {data.balance.toFixed(2)} <span style={{ fontSize: 18, color: "#8a8aa0" }}>{data.currency}</span>
            </div>
          </div>
          <h2>Recent activity</h2>
          <table>
            <thead><tr><th>Type</th><th>Amount</th><th>When</th></tr></thead>
            <tbody>
              {data.ledger.map((l) => (
                <tr key={l.id}>
                  <td><span className="pill">{l.type}</span></td>
                  <td style={{ color: l.amount < 0 ? "#f5a0a0" : "#36d399", fontWeight: 600 }}>
                    {l.amount > 0 ? "+" : ""}{l.amount.toFixed(2)}
                  </td>
                  <td className="muted">{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
