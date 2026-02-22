import Database from "better-sqlite3";

const db = new Database("guessr.db");

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS leaderboard (
    username TEXT PRIMARY KEY,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0
  );
`);

const stmts = {
  getLeaderboard: db.prepare(`
    SELECT username, wins, losses
    FROM leaderboard
  `),
  upsertPlayer: db.prepare(`
    INSERT INTO leaderboard (username, wins, losses)
    VALUES (?, ?, ?)
    ON CONFLICT(username) DO UPDATE SET
      wins = leaderboard.wins + excluded.wins,
      losses = leaderboard.losses + excluded.losses
  `),
};

export const dao = {
  getLeaderboard() {
    return stmts.getLeaderboard.all();
  },
  recordGameResult(username, won) {
    stmts.upsertPlayer.run(username, won ? 1 : 0, won ? 0 : 1);
  },
};
