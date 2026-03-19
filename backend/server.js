import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import dotenv from "dotenv";
import session from "express-session";
import passport from "./config/passport.js";
import { connectDB } from "./db.js";
import gamesRouter from "./routes/games.js";
import playersRouter from "./routes/players.js";
import authRouter from "./routes/auth.js";
import { handleWebSocket } from "./webSocket/wsHandler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Manual CORS ──
app.use((req, res, next) => {
  const allowedOrigins = [
    process.env.FRONTEND_URL?.replace(/\/$/, ""),
    "http://localhost:5173",
  ].filter(Boolean);

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "mathchaos-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/api/auth", authRouter);
app.use("/api/games", gamesRouter);
app.use("/api/players", playersRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

const server = createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  handleWebSocket(ws);
});

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });
