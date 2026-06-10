// Service skeleton. Replace with your implementation.
// See README.md (root of repo) for the contract this service must serve.
import express from "express";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "node-svc" });
});

const port = Number(process.env.PORT ?? 8082);
app.listen(port, () => console.log(`node-svc listening on :${port}`));
