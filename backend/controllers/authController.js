import bcrypt from "bcrypt";
import { getDB } from "../db.js";

const SALT_ROUNDS = 10;

export async function signup(req, res) {
  try {
    const { username, password } = req.body;
    const db = getDB();

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    if (username.trim().length < 3) {
      return res
        .status(400)
        .json({ error: "Username must be at least 3 characters" });
    }

    if (password.length < 4) {
      return res
        .status(400)
        .json({ error: "Password must be at least 4 characters" });
    }

    const cleanUsername = username.trim();

    const existing = await db.collection("users").findOne({
      username: { $regex: new RegExp(`^${cleanUsername}$`, "i") },
    });

    if (existing) {
      return res.status(409).json({ error: "Username already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = {
      username: cleanUsername,
      password: hashedPassword,
      createdAt: new Date(),
    };

    await db.collection("users").insertOne(user);

    const existingPlayer = await db.collection("players").findOne({
      username: { $regex: new RegExp(`^${cleanUsername}$`, "i") },
    });

    if (!existingPlayer) {
      await db.collection("players").insertOne({
        username: cleanUsername,
        wins: 0,
        losses: 0,
        totalGames: 0,
        winStreak: 0,
        bestStreak: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    req.login(user, (err) => {
      if (err)
        return res.status(500).json({ error: "Login after signup failed" });
      res.status(201).json({ user: { username: user.username } });
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Signup failed" });
  }
}

export async function logout(req, res) {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    res.json({ success: true });
  });
}

export async function getMe(req, res) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  res.json({ user: { username: req.user.username } });
}
