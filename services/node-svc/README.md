# node-svc

Replace this skeleton with your Node service. See `/README.md` (top of repo) for:

- The endpoints this service must expose.
- JWT validation requirements.

## Run locally

```
npm install
npm run dev
# → http://localhost:8082/health
```

## Notes

- Seed data lives at `../../data/*.json`. Load on startup.
- Both services share the same JWT secret (env var).
