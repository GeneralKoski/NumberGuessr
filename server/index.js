import cors from "cors";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const rooms = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("create-room", ({ roomId, username, settings }) => {
    if (rooms.has(roomId)) {
      socket.emit("error", "Room already exists");
      return;
    }

    const room = {
      id: roomId,
      settings: settings || { min: 1, max: 100 },
      players: [
        {
          id: socket.id,
          username,
          secretNumber: null,
          hasLied: false,
          guesses: [],
        },
      ],
      status: "waiting", // waiting, picking, playing, finished
    };

    rooms.set(roomId, room);
    socket.join(roomId);
    socket.emit("room-joined", { roomId, room });
  });

  socket.on("join-room", ({ roomId, username }) => {
    const room = rooms.get(roomId);
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
      username,
      secretNumber: null,
      hasLied: false,
      guesses: [],
    });
    socket.join(roomId);

    if (room.players.length === 2) {
      room.status = "picking";
    }

    io.to(roomId).emit("room-joined", { roomId, room });
  });

  socket.on("set-secret-number", ({ roomId, number }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const player = room.players.find((p) => p.id === socket.id);
    if (player) {
      player.secretNumber = parseInt(number);
    }

    if (room.players.every((p) => p.secretNumber !== null)) {
      room.status = "playing";
      room.turn = room.players[0].id; // Player 1 starts
    }

    io.to(roomId).emit("room-update", room);
  });

  socket.on("make-guess", ({ roomId, guess, lie = false }) => {
    const room = rooms.get(roomId);
    if (!room || room.status !== "playing") return;
    if (room.turn !== socket.id) return;

    const playerIndex = room.players.findIndex((p) => p.id === socket.id);
    const opponentIndex = (playerIndex + 1) % 2;
    const player = room.players[playerIndex];
    const opponent = room.players[opponentIndex];

    const targetValue = opponent.secretNumber;
    const guessedValue = parseInt(guess);

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
    } else {
      room.turn = opponent.id;
    }

    io.to(roomId).emit("room-update", room);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    // Cleanup rooms
    for (const [roomId, room] of rooms.entries()) {
      if (room.players.some((p) => p.id === socket.id)) {
        io.to(roomId).emit("player-left", socket.id);
        rooms.delete(roomId);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
