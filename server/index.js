import cors from "cors";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { dao } from "./db.js";

/** @type {import('express').Application} */
const app = express();
app.use(cors());

/**
 * @typedef {Object} Guess
 * @property {number} value
 * @property {'higher' | 'lower' | 'correct'} feedback
 * @property {boolean} lie
 * @property {number} timestamp
 * @property {string} playerId
 */

/**
 * @typedef {Object} Player
 * @property {string} id
 * @property {string} username
 * @property {number | null} secretNumber
 * @property {boolean} hasLied
 * @property {Guess[]} guesses
 */

/**
 * @typedef {Object} Room
 * @property {string} id
 * @property {boolean} isPublic
 * @property {string} hostName
 * @property {{min: number, max: number}} settings
 * @property {Player[]} players
 * @property {'waiting' | 'picking' | 'playing' | 'finished'} status
 * @property {string} [turn]
 * @property {string} [winner]
 */

/** @type {import('http').Server} */
const httpServer = createServer(app);
/** @type {Server} */
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

/** @type {Map<string, Room>} */
const rooms = new Map();

io.on("connection", (socket) => {
  const emitLobbies = () => {
    const publicLobbies = [];
    for (const [id, room] of rooms.entries()) {
      if (room.isPublic && room.status === "waiting") {
        publicLobbies.push({
          code: room.id,
          playerCount: room.players.length,
          hostName: room.hostName,
        });
      }
    }
    io.emit("lobbies:update", publicLobbies);
  };

  socket.on("lobby:list", (cb) => {
    const publicLobbies = [];
    for (const [id, room] of rooms.entries()) {
      if (room.isPublic && room.status === "waiting") {
        publicLobbies.push({
          code: room.id,
          playerCount: room.players.length,
          hostName: room.hostName,
        });
      }
    }
    cb(publicLobbies);
  });

  socket.on("game:leaderboard", (cb) => {
    cb({ leaderboard: dao.getLeaderboard() });
  });

  socket.on("lobby:create", ({ name, isPublic, settings }, cb) => {
    // Generate random code
    let roomId = "";
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for (let i = 0; i < 6; i++) {
      roomId += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const opts = settings || { min: 1, max: 100 };

    /** @type {Room} */
    const room = {
      id: roomId,
      isPublic: !!isPublic,
      hostName: name,
      settings: opts,
      players: [
        {
          id: socket.id,
          username: name,
          secretNumber: null,
          hasLied: false,
          guesses: [],
        },
      ],
      status: "waiting",
    };

    rooms.set(roomId, room);
    socket.join(roomId);

    emitLobbies();

    if (cb) cb({ lobby: room });
    socket.emit("room-joined", { roomId, room });
  });

  socket.on("create-room", ({ roomId, username, settings, isPublic }) => {
    /** @type {string} */
    const rId =
      roomId || Math.random().toString(36).substring(2, 8).toUpperCase();
    /** @type {string} */
    const user = username;
    /** @type {{min: number, max: number}} */
    const opts = settings || { min: 1, max: 100 };

    if (rooms.has(rId)) {
      socket.emit("error", "Room already exists");
      return;
    }

    /** @type {Room} */
    const room = {
      id: rId,
      isPublic: !!isPublic,
      hostName: user,
      settings: opts,
      players: [
        {
          id: socket.id,
          username: user,
          secretNumber: null,
          hasLied: false,
          guesses: [],
        },
      ],
      status: "waiting",
    };

    rooms.set(rId, room);
    socket.join(rId);

    emitLobbies();

    socket.emit("room-joined", { roomId: rId, room });
  });

  socket.on("lobby:join", ({ name, code }, cb) => {
    const room = rooms.get(code);
    if (!room) {
      if (cb) cb({ error: "Lobby not found" });
      return;
    }
    if (room.players.length >= 2) {
      if (cb) cb({ error: "Lobby full" });
      return;
    }

    room.players.push({
      id: socket.id,
      username: name,
      secretNumber: null,
      hasLied: false,
      guesses: [],
    });
    socket.join(code);

    if (room.players.length === 2) {
      room.status = "picking";
      emitLobbies();
    }

    if (cb) cb({ lobby: room });
    io.to(code).emit("room-joined", { roomId: code, room });
  });

  socket.on("join-room", ({ roomId, username }) => {
    /** @type {string} */
    const rId = roomId;
    /** @type {string} */
    const user = username;

    const room = rooms.get(rId);
    if (!room) {
      socket.emit("error", "Room not found");
      return;
    }

    if (room.players.length >= 2) {
      socket.emit("error", "Room full");
      return;
    }

    room.players.push({
      id: socket.id,
      username: user,
      secretNumber: null,
      hasLied: false,
      guesses: [],
    });
    socket.join(rId);

    if (room.players.length === 2) {
      room.status = "picking";
      emitLobbies();
    }

    io.to(rId).emit("room-joined", { roomId: rId, room });
  });

  socket.on("set-secret-number", ({ roomId, number }) => {
    /** @type {string} */
    const rId = roomId;
    /** @type {number} */
    const num = parseInt(number);

    const room = rooms.get(rId);
    if (!room) return;

    const player = room.players.find((p) => p.id === socket.id);
    if (player) {
      player.secretNumber = num;
    }

    if (room.players.every((p) => p.secretNumber !== null)) {
      room.status = "playing";
      room.turn = room.players[0].id; // Player 1 starts
    }

    io.to(rId).emit("room-update", room);
  });

  socket.on("make-guess", ({ roomId, guess, lie = false }) => {
    /** @type {string} */
    const rId = roomId;
    /** @type {number} */
    const guessedValue = parseInt(guess);

    const room = rooms.get(rId);
    if (!room || room.status !== "playing") return;
    if (room.turn !== socket.id) return;

    const playerIndex = room.players.findIndex((p) => p.id === socket.id);
    const opponentIndex = (playerIndex + 1) % 2;
    const player = room.players[playerIndex];
    const opponent = room.players[opponentIndex];

    const targetValue = opponent.secretNumber;

    if (targetValue === null) return;

    /** @type {'higher' | 'lower' | 'correct'} */
    let feedback;
    let actualLie = false;

    if (lie && !player.hasLied) {
      player.hasLied = true;
      actualLie = true;
      // Lie: say the opposite of truth
      if (guessedValue < targetValue) feedback = "lower";
      else if (guessedValue > targetValue) feedback = "higher";
      else feedback = "higher"; // Lie even if correct? Let's say if you lie on the correct number, you just say higher/lower
    } else {
      if (guessedValue < targetValue) feedback = "higher";
      else if (guessedValue > targetValue) feedback = "lower";
      else feedback = "correct";
    }

    player.guesses.push({
      value: guessedValue,
      feedback,
      lie: actualLie,
      timestamp: Date.now(),
      playerId: socket.id,
    });

    if (feedback === "correct") {
      room.status = "finished";
      room.winner = player.username;

      try {
        dao.recordGameResult(player.username, true);
        dao.recordGameResult(opponent.username, false);
      } catch (e) {
        console.error("Failed to record game result", e);
      }
    } else {
      room.turn = opponent.id;
    }

    io.to(rId).emit("room-update", room);
  });

  socket.on("disconnect", () => {
    let lobbiesChanged = false;
    // Cleanup rooms
    for (const [roomId, room] of rooms.entries()) {
      if (room.players.some((p) => p.id === socket.id)) {
        io.to(roomId).emit("player-left", socket.id);
        rooms.delete(roomId);
        if (room.isPublic && room.status === "waiting") lobbiesChanged = true;
      }
    }
    if (lobbiesChanged) emitLobbies();
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
