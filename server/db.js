import Database from "better-sqlite3";

const db = new Database("guessr.db");

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS leaderboard_v2 (
    token TEXT PRIMARY KEY,
    username TEXT,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0
  );
`);

const stmts = {
  getLeaderboard: db.prepare(`
    SELECT username, wins, losses
    FROM leaderboard_v2
    ORDER BY wins DESC, losses ASC
  `),
  upsertPlayer: db.prepare(`
    INSERT INTO leaderboard_v2 (token, username, wins, losses)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(token) DO UPDATE SET
      username = excluded.username,
      wins = leaderboard_v2.wins + excluded.wins,
      losses = leaderboard_v2.losses + excluded.losses
  `),
};

export const dao = {
  getLeaderboard() {
    return stmts.getLeaderboard.all();
  },
  recordGameResult(token, username, won) {
    if (!token) return;
    stmts.upsertPlayer.run(token, username, won ? 1 : 0, won ? 0 : 1);
  },
};
