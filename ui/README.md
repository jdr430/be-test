# Provided Frontend — Next.js 16.2.4

This is the UI you build the backend for. **Do not change the API contracts** in `src/lib/api.ts` — those are the contract the test grades against.

## Local

```bash
cp .env.example .env.local
npm install
npm run dev    # http://localhost:3000
```

## Pages

- `/login` — POSTs to `/auth/login`
- `/lobby` — GET `/games`, POST `/bets`
- `/wallet` — GET `/wallet/:userId`
- `/bets` — GET `/bets?userId=...`
- `/notifications` — GET `/notifications`, POST `/notifications/:id/read`

Two env vars decide which backend handles what:

```
NEXT_PUBLIC_WALLET_API=http://localhost:8081
NEXT_PUBLIC_PROFILE_API=http://localhost:8082
```

Point them at whichever service (Go or Node) owns that domain in your implementation.
