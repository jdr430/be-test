"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, Sport } from "@/lib/api";

export default function SportsPage() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.sports()
      .then((s) => setSports(s))
      .catch((e) => setErr(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const byGroup = sports.reduce<Record<string, Sport[]>>((acc, s) => {
    (acc[s.group] ||= []).push(s);
    return acc;
  }, {});

  return (
    <div>
      <h1>Sports</h1>
      {loading && <p className="muted">Loading sports…</p>}
      {err && <div className="card" style={{ borderColor: "#5c1f1f" }}><p style={{ color: "#f5a0a0", margin: 0 }}>{err}</p>
        <p className="muted" style={{ marginBottom: 0 }}>Is your odds service running on <code>{process.env.NEXT_PUBLIC_WALLET_API ?? "http://localhost:8081"}</code>?</p>
      </div>}
      {Object.entries(byGroup).map(([group, items]) => (
        <section key={group}>
          <h2>{group}</h2>
          <div className="sport-grid">
            {items.map((s) => (
              <Link key={s.key} href={`/sports/${s.key}`} className="sport-tile" style={{ textDecoration: "none", color: "inherit" }}>
                <div className="title">{s.title}</div>
                <div className="meta">
                  {s.active ? <span className="pill active">Active</span> : <span className="pill">Off-season</span>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
