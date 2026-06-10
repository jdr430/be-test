const WALLET = process.env.NEXT_PUBLIC_WALLET_API ?? "http://localhost:8081";
const PROFILE = process.env.NEXT_PUBLIC_PROFILE_API ?? "http://localhost:8082";
const MOCK = process.env.NEXT_PUBLIC_MOCK === "true";

function token() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") ?? "";
}

async function req<T>(base: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

export type Sport = { key: string; group: string; title: string; active: boolean; hasOutrights: boolean };
export type EventSummary = { id: string; sportKey: string; commenceTime: string; homeTeam: string; awayTeam: string };
export type Outcome = { name: string; price: number };
export type Market = { key: string; outcomes: Outcome[] };
export type Bookmaker = { key: string; title: string; markets: Market[] };
export type EventOdds = EventSummary & { bookmakers: Bookmaker[] };
export type Bet = { id: string; eventId: string; market: string; selection: string; stake: number; odds: number; status: "PENDING" | "WON" | "LOST"; payout: number; placedAt: string; settledAt: string | null };
export type Wallet = { balance: number; currency: string; ledger: Array<{ id: string; type: string; amount: number; createdAt: string }> };
export type Notif = { id: string; title: string; body: string; readAt: string | null; createdAt: string };
export type Me = { id: string; email: string; displayName: string; currency: string };

// Dynamically load mock impl only when flag is on (keeps it out of the prod bundle when not needed).
async function m() {
  return (await import("./mock")).mock;
}

export const api = {
  login: async (email: string, pin: string) =>
    MOCK ? (await m()).login(email, pin) : req<{ token: string; userId: string }>(PROFILE, "/auth/login", { method: "POST", body: JSON.stringify({ email, pin }) }),
  me: async () => (MOCK ? (await m()).me() : req<Me>(PROFILE, "/me")),
  notifications: async (limit = 20) => (MOCK ? (await m()).notifications() : req<Notif[]>(PROFILE, `/notifications?limit=${limit}`)),
  markRead: async (id: string) => (MOCK ? (await m()).markRead(id) : req<{ ok: boolean }>(PROFILE, `/notifications/${id}/read`, { method: "POST" })),

  sports: async () => (MOCK ? (await m()).sports() : req<Sport[]>(WALLET, "/sports")),
  events: async (sportKey: string) => (MOCK ? (await m()).events(sportKey) : req<EventSummary[]>(WALLET, `/sports/${sportKey}/events`)),
  odds: async (eventId: string, sport: string) => (MOCK ? (await m()).odds(eventId, sport) : req<EventOdds>(WALLET, `/events/${eventId}/odds?sport=${sport}`)),
  placeBet: async (payload: { userId: string; eventId: string; sportKey: string; market: string; selection: string; stake: number; odds: number }) =>
    MOCK
      ? (await m()).placeBet(payload)
      : req<{ betId: string; status: string }>(WALLET, "/bets", { method: "POST", body: JSON.stringify(payload) }),
  bets: async (userId: string, limit = 30) => (MOCK ? (await m()).bets() : req<Bet[]>(WALLET, `/bets?userId=${userId}&limit=${limit}`)),
  wallet: async (userId: string) => (MOCK ? (await m()).wallet() : req<Wallet>(WALLET, `/wallet/${userId}`)),
};
