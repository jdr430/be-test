/**
 * In-browser mock backend.
 * Active only when NEXT_PUBLIC_MOCK=true. Lets you preview every screen without a real server.
 * The candidate disables this by removing/flipping the env flag.
 */
import type { Bet, Bookmaker, EventOdds, EventSummary, Me, Notif, Sport, Wallet } from "./api";

export const MOCK_ENABLED = process.env.NEXT_PUBLIC_MOCK === "true";

const wait = (ms = 250) => new Promise((r) => setTimeout(r, ms));

// ---- canned data ----

const ME: Me = { id: "00000000-0000-0000-0000-000000000005", email: "luca.galli5@example.com", displayName: "Luca Galli", currency: "USD" };

const SPORTS: Sport[] = [
  { key: "soccer_epl", group: "Soccer", title: "EPL", active: true, hasOutrights: false },
  { key: "soccer_spain_la_liga", group: "Soccer", title: "La Liga", active: true, hasOutrights: false },
  { key: "soccer_italy_serie_a", group: "Soccer", title: "Serie A", active: true, hasOutrights: false },
  { key: "soccer_germany_bundesliga", group: "Soccer", title: "Bundesliga", active: true, hasOutrights: false },
  { key: "basketball_nba", group: "Basketball", title: "NBA", active: true, hasOutrights: false },
  { key: "basketball_euroleague", group: "Basketball", title: "EuroLeague", active: false, hasOutrights: false },
  { key: "tennis_atp_french_open", group: "Tennis", title: "ATP French Open", active: true, hasOutrights: true },
  { key: "tennis_wta_french_open", group: "Tennis", title: "WTA French Open", active: true, hasOutrights: true },
  { key: "americanfootball_nfl", group: "American Football", title: "NFL", active: false, hasOutrights: false },
  { key: "icehockey_nhl", group: "Ice Hockey", title: "NHL", active: true, hasOutrights: false },
];

const PAIRS: Record<string, Array<[string, string]>> = {
  soccer_epl: [
    ["Arsenal", "Manchester United"],
    ["Liverpool", "Chelsea"],
    ["Tottenham", "Newcastle"],
    ["Manchester City", "Aston Villa"],
    ["Brighton", "West Ham"],
  ],
  soccer_spain_la_liga: [
    ["Real Madrid", "Barcelona"],
    ["Atletico Madrid", "Sevilla"],
    ["Real Sociedad", "Athletic Bilbao"],
  ],
  soccer_italy_serie_a: [
    ["Inter", "Juventus"],
    ["AC Milan", "Napoli"],
    ["Roma", "Lazio"],
  ],
  soccer_germany_bundesliga: [
    ["Bayern Munich", "Borussia Dortmund"],
    ["RB Leipzig", "Bayer Leverkusen"],
  ],
  basketball_nba: [
    ["Lakers", "Celtics"],
    ["Warriors", "Bucks"],
    ["Nuggets", "Heat"],
    ["Suns", "76ers"],
  ],
  basketball_euroleague: [
    ["Real Madrid", "Olympiacos"],
    ["Panathinaikos", "Barcelona"],
  ],
  tennis_atp_french_open: [
    ["Sinner", "Alcaraz"],
    ["Djokovic", "Zverev"],
  ],
  tennis_wta_french_open: [
    ["Swiatek", "Sabalenka"],
    ["Gauff", "Rybakina"],
  ],
  americanfootball_nfl: [
    ["Chiefs", "Bills"],
    ["49ers", "Cowboys"],
  ],
  icehockey_nhl: [
    ["Oilers", "Panthers"],
    ["Rangers", "Bruins"],
  ],
};

function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function eventsForSport(sportKey: string): EventSummary[] {
  const pairs = PAIRS[sportKey] ?? [];
  const r = rand(sportKey.length * 13);
  const now = Date.now();
  return pairs.map((p, i) => ({
    id: `evt-${sportKey}-${i + 1}`,
    sportKey,
    commenceTime: new Date(now + (1 + i) * 6 * 3600 * 1000 + r() * 3600 * 1000).toISOString(),
    homeTeam: p[0],
    awayTeam: p[1],
  }));
}

const BOOKMAKERS = [
  { key: "pinnacle", title: "Pinnacle" },
  { key: "bet365", title: "Bet365" },
  { key: "williamhill", title: "William Hill" },
  { key: "unibet", title: "Unibet" },
];

function oddsForEvent(eventId: string, sportKey: string): EventOdds {
  const pairs = PAIRS[sportKey] ?? [["Home", "Away"]];
  const idx = Math.max(0, parseInt(eventId.split("-").pop() ?? "1") - 1);
  const [home, away] = pairs[idx] ?? pairs[0];
  const r = rand(eventId.length * 7 + idx);
  const sportSupportsDraw = sportKey.startsWith("soccer_");
  const bookmakers: Bookmaker[] = BOOKMAKERS.map((bm) => {
    const base = 1.7 + r() * 1.6;
    const homePrice = +(base + r() * 0.4).toFixed(2);
    const awayPrice = +(1.7 + r() * 2.0).toFixed(2);
    const outcomes = sportSupportsDraw
      ? [
          { name: home, price: homePrice },
          { name: "Draw", price: +(3.0 + r() * 1.5).toFixed(2) },
          { name: away, price: awayPrice },
        ]
      : [
          { name: home, price: homePrice },
          { name: away, price: awayPrice },
        ];
    return { key: bm.key, title: bm.title, markets: [{ key: "h2h", outcomes }] };
  });
  return {
    id: eventId,
    sportKey,
    commenceTime: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
    homeTeam: home,
    awayTeam: away,
    bookmakers,
  };
}

// ---- mutable in-memory state (per browser session) ----

let balance = 1500;
let bets: Bet[] = [
  {
    id: "bet-seed-1",
    eventId: "evt-soccer_epl-1",
    market: "h2h",
    selection: "Arsenal",
    stake: 20,
    odds: 2.1,
    status: "WON",
    payout: 42,
    placedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    settledAt: new Date(Date.now() - 3 * 3600 * 1000 + 30 * 1000).toISOString(),
  },
  {
    id: "bet-seed-2",
    eventId: "evt-basketball_nba-1",
    market: "h2h",
    selection: "Lakers",
    stake: 15,
    odds: 1.85,
    status: "LOST",
    payout: 0,
    placedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    settledAt: new Date(Date.now() - 8 * 3600 * 1000 + 30 * 1000).toISOString(),
  },
  {
    id: "bet-seed-3",
    eventId: "evt-soccer_italy_serie_a-1",
    market: "h2h",
    selection: "Draw",
    stake: 10,
    odds: 3.4,
    status: "PENDING",
    payout: 0,
    placedAt: new Date(Date.now() - 20 * 1000).toISOString(),
    settledAt: null,
  },
];

const ledger: Array<{ id: string; type: string; amount: number; createdAt: string }> = [
  { id: "lg-0", type: "OPENING_DEPOSIT", amount: 1500, createdAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString() },
  { id: "lg-1", type: "BET_DEBIT", amount: -20, createdAt: bets[0].placedAt },
  { id: "lg-2", type: "BET_CREDIT", amount: 42, createdAt: bets[0].settledAt! },
  { id: "lg-3", type: "BET_DEBIT", amount: -15, createdAt: bets[1].placedAt },
  { id: "lg-4", type: "BET_DEBIT", amount: -10, createdAt: bets[2].placedAt },
];
// reconcile balance with ledger
balance = ledger.reduce((acc, l) => acc + l.amount, 0);

let notifs: Notif[] = [
  { id: "n1", title: "Welcome bonus credited", body: "Your 100% welcome bonus has been credited to your account.", readAt: null, createdAt: new Date(Date.now() - 60 * 1000).toISOString() },
  { id: "n2", title: "Big win!", body: "Congrats - you just won 42.00 USD! Check your wallet.", readAt: null, createdAt: new Date(Date.now() - 3 * 3600 * 1000 + 60 * 1000).toISOString() },
  { id: "n3", title: "Weekly cashback", body: "Your weekly cashback has landed.", readAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString(), createdAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString() },
  { id: "n4", title: "New game live", body: "Check out the new release in the Lobby.", readAt: null, createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString() },
  { id: "n5", title: "KYC reminder", body: "Please complete your KYC verification to keep withdrawing.", readAt: new Date(Date.now() - 86400 * 1000).toISOString(), createdAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString() },
];

function settleLater(bet: Bet) {
  setTimeout(() => {
    const b = bets.find((x) => x.id === bet.id);
    if (!b || b.status !== "PENDING") return;
    const won = Math.random() < 0.45;
    b.status = won ? "WON" : "LOST";
    b.payout = won ? +(b.stake * b.odds).toFixed(2) : 0;
    b.settledAt = new Date().toISOString();
    if (won) {
      balance += b.payout;
      ledger.push({ id: `lg-${ledger.length}`, type: "BET_CREDIT", amount: b.payout, createdAt: b.settledAt });
      notifs.unshift({
        id: `n-${Date.now()}`,
        title: "Big win!",
        body: `Congrats - your bet just won ${b.payout.toFixed(2)} ${ME.currency}!`,
        readAt: null,
        createdAt: b.settledAt,
      });
    }
  }, 30000);
}

// ---- mock api impls ----

export const mock = {
  async login(email: string, _pin: string) {
    await wait(150);
    return { token: "mock-token-" + Date.now(), userId: ME.id };
  },
  async me(): Promise<Me> { await wait(100); return ME; },
  async sports(): Promise<Sport[]> { await wait(150); return SPORTS; },
  async events(sportKey: string): Promise<EventSummary[]> { await wait(200); return eventsForSport(sportKey); },
  async odds(eventId: string, sportKey: string): Promise<EventOdds> { await wait(220); return oddsForEvent(eventId, sportKey); },
  async wallet(): Promise<Wallet> {
    await wait(120);
    return { balance: +balance.toFixed(2), currency: ME.currency, ledger: [...ledger].reverse().slice(0, 10) };
  },
  async bets(): Promise<Bet[]> { await wait(120); return [...bets].sort((a, b) => b.placedAt.localeCompare(a.placedAt)); },
  async placeBet(p: { eventId: string; market: string; selection: string; stake: number; odds: number }) {
    await wait(200);
    if (p.stake > balance) throw new Error("Insufficient balance");
    const bet: Bet = {
      id: "bet-" + Date.now(),
      eventId: p.eventId,
      market: p.market,
      selection: p.selection,
      stake: p.stake,
      odds: p.odds,
      status: "PENDING",
      payout: 0,
      placedAt: new Date().toISOString(),
      settledAt: null,
    };
    bets.unshift(bet);
    balance -= p.stake;
    ledger.push({ id: `lg-${ledger.length}`, type: "BET_DEBIT", amount: -p.stake, createdAt: bet.placedAt });
    settleLater(bet);
    return { betId: bet.id, status: "PENDING" };
  },
  async notifications(): Promise<Notif[]> { await wait(120); return [...notifs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)); },
  async markRead(id: string) {
    await wait(100);
    const n = notifs.find((x) => x.id === id);
    if (n) n.readAt = new Date().toISOString();
    return { ok: true };
  },
};
