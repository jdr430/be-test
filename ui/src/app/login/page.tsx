"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { setSession } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("1234");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      const r = await api.login(email, pin);
      setSession(r.token, r.userId);
      router.push("/sports");
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "60px auto" }}>
      <h1>Sign in</h1>
      <p className="muted">Use any seeded email. Default PIN is <code>1234</code>.</p>
      <form onSubmit={submit} className="card" style={{ display: "grid", gap: 12 }}>
        <input placeholder="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input placeholder="pin" value={pin} onChange={(e) => setPin(e.target.value)} required />
        <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        {err && <p style={{ color: "#f5a0a0", margin: 0, fontSize: 13 }}>{err}</p>}
      </form>
      <p className="muted" style={{ marginTop: 20 }}>
        Examples: <code>alex.smith1@example.com</code>, <code>sam.jones2@example.com</code>, <code>chris.brown3@example.com</code>
      </p>
    </div>
  );
}
