import { getDB } from "../db.js";

function usernameQuery(username) {
  return { username: { $regex: new RegExp(`^${username}$`, "i") } };
}

export async function createPlayer(req, res) {
  try {
    const { username } = req.body;

    if (!username || username.trim() === "") {
      return res.status(400).json({ error: "Username is required" });
    }

    const db = getDB();
    const clean = username.trim();

    const existing = await db
      .collection("players")
      .findOne(usernameQuery(clean));
    if (existing) {
      return res.status(200).json(existing);
    }

    const player = {
      username: clean,
      wins: 0,
      losses: 0,
      totalGames: 0,
      winStreak: 0,
      bestStreak: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("players").insertOne(player);
    res.status(201).json({ ...player, _id: result.insertedId });
  } catch (err) {
    console.error("createPlayer error:", err);
    res.status(500).json({ error: "Failed to create player" });
  }
}

export async function getPlayers(req, res) {
  try {
    const { sort = "wins", limit = 20, skip = 0 } = req.query;
    const db = getDB();

    const validSorts = ["wins", "winStreak", "totalGames"];
    const sortField = validSorts.includes(sort) ? sort : "wins";

    const players = await db
      .collection("players")
      .find({})
      .sort({ [sortField]: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .toArray();

    res.json(players);
  } catch (err) {
    console.error("getPlayers error:", err);
    res.status(500).json({ error: "Failed to fetch players" });
  }
}

export async function getPlayerCount(req, res) {
  try {
    const db = getDB();
    const count = await db.collection("players").countDocuments();
    res.json({ count });
  } catch (err) {
    console.error("getPlayerCount error:", err);
    res.status(500).json({ error: "Failed to get count" });
  }
}

export async function getPlayerByUsername(req, res) {
  try {
    const db = getDB();
    const player = await db
      .collection("players")
      .findOne(usernameQuery(req.params.username));

    if (!player) return res.status(404).json({ error: "Player not found" });
    res.json(player);
  } catch (err) {
    console.error("getPlayerByUsername error:", err);
    res.status(500).json({ error: "Failed to fetch player" });
  }
}

export async function updatePlayerResult(req, res) {
  try {
    const { won } = req.body;
    const db = getDB();
    const username = req.params.username;

    const player = await db
      .collection("players")
      .findOne(usernameQuery(username));
    if (!player) return res.status(404).json({ error: "Player not found" });

    const newWins = won ? player.wins + 1 : player.wins;
    const newLosses = won ? player.losses : player.losses + 1;
    const newStreak = won ? player.winStreak + 1 : 0;
    const newBestStreak = Math.max(player.bestStreak, newStreak);

    await db.collection("players").updateOne(
      { _id: player._id },
      {
        $set: {
          wins: newWins,
          losses: newLosses,
          totalGames: newWins + newLosses,
          winStreak: newStreak,
          bestStreak: newBestStreak,
          updatedAt: new Date(),
        },
      }
    );

    res.json({
      username: player.username,
      wins: newWins,
      losses: newLosses,
      totalGames: newWins + newLosses,
      winStreak: newStreak,
      bestStreak: newBestStreak,
    });
  } catch (err) {
    console.error("updatePlayerResult error:", err);
    res.status(500).json({ error: "Failed to update player result" });
  }
}

export async function updatePlayer(req, res) {
  try {
    const db = getDB();
    const username = req.params.username;

    const {
      _id,
      wins,
      losses,
      totalGames,
      winStreak,
      bestStreak,
      createdAt,
      ...allowed
    } = req.body;

    if (Object.keys(allowed).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    allowed.updatedAt = new Date();

    const player = await db
      .collection("players")
      .findOne(usernameQuery(username));
    if (!player) return res.status(404).json({ error: "Player not found" });

    await db
      .collection("players")
      .updateOne({ _id: player._id }, { $set: allowed });

    res.json({ success: true, updated: allowed });
  } catch (err) {
    console.error("updatePlayer error:", err);
    res.status(500).json({ error: "Failed to update player" });
  }
}

export async function deletePlayer(req, res) {
  try {
    const db = getDB();
    const username = req.params.username;

    const player = await db
      .collection("players")
      .findOne(usernameQuery(username));
    if (!player) return res.status(404).json({ error: "Player not found" });

    await db.collection("players").deleteOne({ _id: player._id });
    await db.collection("users").deleteOne(usernameQuery(username));

    res.json({ success: true, deleted: player.username });
  } catch (err) {
    console.error("deletePlayer error:", err);
    res.status(500).json({ error: "Failed to delete player" });
  }
}
