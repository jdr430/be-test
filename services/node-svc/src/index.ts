// Service skeleton. Replace with your implementation.
// See README.md (root of repo) for the contract this service must serve.
import 'dotenv/config';
import express from "express";
import dotenv from 'dotenv';
import { login } from './auth/authService';
import path from "path";
import { createAuthMiddleware }  from './auth/authMiddleware';
import  { UserStore }  from './store/userStore';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set — check your .env file');
}
const authMiddleware = createAuthMiddleware(JWT_SECRET);
const userStore = new UserStore(
    process.env.SEED_DATA_PATH ?? path.join(__dirname, '../../../data', 'users.json')
);

const app = express();
app.use(express.json());

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "node-svc" });
});

app.post('/auth/login', async (req, res) => {
  const { email, pin } = req.body;

  if (!email || !pin) {
    return res.status(400).json({ error: 'email and pin required' });
  }

  try {
    const { token, userId } = await login(email, pin, userStore);
    res.json({ token, userId });
  } catch (err) {
    console.log(err)
    res.status(401).json({ error: 'invalid credentials' });
  }
});

app.get('/me', authMiddleware, (req, res) => {
  const user = userStore.findById(req.user.userId);
  console.log(user)
  if (!user) return res.status(404).json({ error: 'user not found' });

  res.json({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    currency: user.currency
  });
});

app.get('/notifications', authMiddleware, (req, res) => {
  // ...
});


const port = Number(process.env.PORT ?? 8082);
app.listen(port, () => console.log(`node-svc listening on :${port}`));
