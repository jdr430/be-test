"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { api, EventSummary } from "@/lib/api";

export default function SportEventsPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = use(params);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.events(key)
      .then((e) => setEvents(e))
      .catch((e) => setErr(String(e)))
      .finally(() => setLoading(false));
  }, [key]);

  function fmtTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" });
  }

  return (
    <div>
      <p className="muted"><Link href="/sports">← All sports</Link></p>
      <h1>{key.replace(/_/g, " ").toUpperCase()} - Upcoming Events</h1>
      {loading && <p className="muted">Loading events…</p>}
      {err && <div className="card" style={{ borderColor: "#5c1f1f" }}><p style={{ color: "#f5a0a0", margin: 0 }}>{err}</p></div>}
      {!loading && !err && events.length === 0 && <div className="empty-state">No upcoming events for this sport.</div>}
      {events.map((e) => (
        <Link key={e.id} href={`/events/${e.id}?sport=${e.sportKey}`} className="event-row" style={{ textDecoration: "none", color: "inherit" }}>
          <span className="time">{fmtTime(e.commenceTime)}</span>
          <span className="team">{e.homeTeam}</span>
          <span className="team" style={{ color: "#8a8aa0" }}>vs {e.awayTeam}</span>
          <span style={{ textAlign: "right", color: "#36d399", fontSize: 13 }}>View odds →</span>
        </Link>
      ))}
    </div>
  );
}
