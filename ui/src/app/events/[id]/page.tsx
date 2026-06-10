"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { use, useEffect, useState } from "react";
import { api, EventOdds } from "@/lib/api";
import { getUserId } from "@/lib/auth";

type Selection = { bookmaker: string; market: string; name: string; price: number };

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const sport = useSearchParams().get("sport") ?? "";
  const [data, setData] = useState<EventOdds | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [stake, setStake] = useState("10.00");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null);

  useEffect(() => {
    api.odds(id, sport).then(setData).catch((e) => setErr(String(e)));
  }, [id, sport]);

  function fmtTime(iso: string) {
    return new Date(iso).toLocaleString(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" });
  }

  async function placeBet() {
    const userId = getUserId();
    if (!userId || !selection) return;
    setBusy(true); setToast(null);
    try {
      const r = await api.placeBet({
        userId,
        eventId: id,
        sportKey: sport,
        market: selection.market,
        selection: selection.name,
        stake: parseFloat(stake),
        odds: selection.price,
      });
      setToast({ msg: `Bet placed: ${r.betId.slice(0, 8)}… (${r.status})` });
      setSelection(null);
      setTimeout(() => setToast(null), 4000);
    } catch (e) {
      setToast({ msg: String(e), error: true });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setBusy(false);
    }
  }

  const stakeNum = parseFloat(stake) || 0;
  const payout = selection ? stakeNum * selection.price : 0;

  if (err) return <div className="card" style={{ borderColor: "#5c1f1f" }}><p style={{ color: "#f5a0a0" }}>{err}</p></div>;
  if (!data) return <p className="muted">Loading odds…</p>;

  return (
    <div>
      <p className="muted"><Link href={`/sports/${data.sportKey}`}>← {data.sportKey.replace(/_/g, " ").toUpperCase()}</Link></p>
      <h1>{data.homeTeam} vs {data.awayTeam}</h1>
      <p className="muted" style={{ marginTop: -8 }}>{fmtTime(data.commenceTime)}</p>

      <div className="event-detail">
        <div>
          {data.bookmakers.length === 0 && <div className="empty-state">No bookmaker odds available.</div>}
          {data.bookmakers.map((bm) => (
            <div key={bm.key} className="card">
              <h3 style={{ margin: "0 0 10px", fontSize: 14, textTransform: "uppercase", color: "#8a8aa0", letterSpacing: 1 }}>{bm.title}</h3>
              {bm.markets.filter((m) => m.key === "h2h").map((m) => (
                <div key={m.key} className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                  {m.outcomes.map((o) => {
                    const selected = selection && selection.bookmaker === bm.key && selection.name === o.name;
                    return (
                      <button
                        key={o.name}
                        className={`odds-btn ${selected ? "selected" : ""}`}
                        onClick={() => setSelection({ bookmaker: bm.title, market: "h2h", name: o.name, price: o.price })}
                      >
                        <div style={{ fontSize: 11, opacity: 0.7 }}>{o.name}</div>
                        <div>{o.price.toFixed(2)}</div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>

        <aside className="bet-slip">
          <h3>Bet Slip</h3>
          {selection ? (
            <>
              <div className="selection-card">
                <div className="label">{selection.bookmaker} · {selection.market.toUpperCase()}</div>
                <div style={{ fontWeight: 600, marginTop: 4 }}>{selection.name}</div>
                <div style={{ color: "#36d399", marginTop: 4 }}>@ {selection.price.toFixed(2)}</div>
              </div>
              <label>
                <div className="label" style={{ marginBottom: 4 }}>Stake</div>
                <input value={stake} onChange={(e) => setStake(e.target.value)} type="number" min="0.5" step="0.5" style={{ width: "100%" }} />
              </label>
              <div className="stat-row">
                <span className="muted">Odds</span><span>{selection.price.toFixed(2)}</span>
              </div>
              <div className="stat-row">
                <span className="muted">Potential payout</span><span className="payout">{payout.toFixed(2)}</span>
              </div>
              <button className="btn btn-primary" onClick={placeBet} disabled={busy || stakeNum <= 0}>
                {busy ? "Placing…" : "Place bet"}
              </button>
            </>
          ) : (
            <p className="muted">Tap an odds price on the left to add it to the slip.</p>
          )}
        </aside>
      </div>

      {toast && <div className={`toast ${toast.error ? "error" : ""}`}>{toast.msg}</div>}
    </div>
  );
}
