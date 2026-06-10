"use client";
import { useEffect, useState } from "react";
import { api, Notif } from "@/lib/api";

export default function NotificationsPage() {
  const [items, setItems] = useState<Notif[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try { setItems(await api.notifications(30)); } catch (e) { setErr(String(e)); }
  }
  useEffect(() => { load(); }, []);

  async function markRead(id: string) {
    await api.markRead(id);
    load();
  }

  return (
    <div>
      <h1>Notifications</h1>
      {err && <div className="card" style={{ borderColor: "#5c1f1f" }}><p style={{ color: "#f5a0a0", margin: 0 }}>{err}</p></div>}
      {items.length === 0 && !err && <div className="empty-state">No notifications.</div>}
      {items.map((n) => (
        <div key={n.id} className="card" style={{ opacity: n.readAt ? 0.7 : 1 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <strong>{n.title}</strong>
            <span className="muted">{new Date(n.createdAt).toLocaleString()}</span>
          </div>
          <p style={{ margin: "8px 0", color: "#c4c4d4" }}>{n.body}</p>
          {n.readAt ? <span className="pill">Read</span> : <button className="btn" onClick={() => markRead(n.id)}>Mark as read</button>}
        </div>
      ))}
    </div>
  );
}
