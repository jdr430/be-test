# go-svc

Replace this skeleton with your Go service. See `/README.md` (top of repo) for:

- The endpoints this service must expose (depends on the split you chose).
- The concurrent-safety requirements for the wallet.
- The Odds API caching expectations.

## Run locally

```
go run .
# → http://localhost:8081/health
```

## Notes

- Seed data lives at `/data/users.json` and `/data/notifications.json` (one level up from this folder). Load on startup if this service owns wallet/profile.
- Odds API key is in the root `.env` as `ODDS_API_KEY`.
