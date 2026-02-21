import { AnimatePresence, motion } from "framer-motion";
import {
  Hash,
  Home,
  ShieldAlert,
  Sparkles,
  Swords,
  Trophy,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import socket from "./socket";

type Player = {
  id: string;
  username: string;
  secretNumber: number | null;
  hasLied: boolean;
  guesses: any[];
};

type Room = {
  id: string;
  settings: { min: number; max: number };
  players: Player[];
  status: "waiting" | "picking" | "playing" | "finished";
  turn?: string;
  winner?: string;
};

export default function App() {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [room, setRoom] = useState<Room | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [secretInput, setSecretInput] = useState("");
  const [guessInput, setGuessInput] = useState("");
  const [willLie, setWillLie] = useState(false);
  const [error, setError] = useState("");
  const [minRange, setMinRange] = useState(1);
  const [maxRange, setMaxRange] = useState(100);

  useEffect(() => {
    socket.on("room-joined", ({ room }) => {
      setRoom(room);
      setIsJoined(true);
      setError("");
    });

    socket.on("room-update", (updatedRoom) => {
      setRoom(updatedRoom);
    });

    socket.on("error", (msg) => {
      setError(msg);
    });

    socket.on("player-left", () => {
      alert("Opponent left the game");
      window.location.reload();
    });

    return () => {
      socket.off("room-joined");
      socket.off("room-update");
      socket.off("error");
      socket.off("player-left");
    };
  }, []);

  const createRoom = () => {
    if (!username || !roomId) return;
    socket.emit("create-room", {
      roomId,
      username,
      settings: { min: minRange, max: maxRange },
    });
  };

  const joinRoom = () => {
    if (!username || !roomId) return;
    socket.emit("join-room", { roomId, username });
  };

  const setSecret = () => {
    const num = parseInt(secretInput);
    if (isNaN(num) || num < room!.settings.min || num > room!.settings.max) {
      setError(
        `Choice must be between ${room!.settings.min} and ${room!.settings.max}`,
      );
      return;
    }
    socket.emit("set-secret-number", { roomId: room!.id, number: num });
    setSecretInput("");
    setError("");
  };

  const makeGuess = () => {
    const num = parseInt(guessInput);
    if (isNaN(num)) return;
    socket.emit("make-guess", { roomId: room!.id, guess: num, lie: willLie });
    setGuessInput("");
    setWillLie(false);
  };

  const me = room?.players.find((p) => p.id === socket.id);
  const opponent = room?.players.find((p) => p.id !== socket.id);
  const isMyTurn = room?.turn === socket.id;

  if (!isJoined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-8 bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl"
        >
          <div className="flex items-center justify-center mb-8 space-x-3">
            <div className="p-3 bg-primary rounded-2xl">
              <Hash className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent italic">
              GUESS 1v1
            </h1>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 ml-1">
                Your Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all"
                  placeholder="Enter name..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 ml-1">
                Lobby ID
              </label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all"
                  placeholder="Lobby code..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 ml-1">
                  Min
                </label>
                <input
                  type="number"
                  value={minRange}
                  onChange={(e) => setMinRange(parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 ml-1">
                  Max
                </label>
                <input
                  type="number"
                  value={maxRange}
                  onChange={(e) => setMaxRange(parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center font-medium animate-pulse">
                {error}
              </p>
            )}

            <div className="flex space-x-4 pt-4">
              <button
                onClick={joinRoom}
                className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold transition-all active:scale-95"
              >
                Join
              </button>
              <button
                onClick={createRoom}
                className="flex-1 py-4 bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/20 rounded-2xl font-bold transition-all active:scale-95"
              >
                Create
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

    <div className="min-h-screen flex flex-col">
      {/* Header matching KosQuiz style */}
      <header className="relative flex items-center justify-center px-4 py-6 border-b border-white/5">
        <button
          onClick={() => window.location.reload()}
          className="text-3xl font-black tracking-widest uppercase cursor-pointer text-[var(--accent-color)] hover:text-[var(--accent-hover)] transition-colors italic"
        >
          GUESS 1v1
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-4xl mx-auto w-full">
        <div className="w-full flex flex-col space-y-8">
          {isJoined && (
            <div className="flex justify-between items-center bg-white/5 p-4 rounded-3xl border border-white/10 shadow-lg">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary/20 rounded-xl text-primary">
                  <Swords className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
                    Lobby ID
                  </p>
                  <p className="font-mono font-bold text-lg text-white">{room?.id}</p>
                </div>
              </div>
              <div className="flex -space-x-3">
                {room?.players.map((p, i) => (
                  <div
                    key={p.id}
                    className={`w-10 h-10 rounded-full border-2 border-[#0b0f19] bg-gradient-to-br ${i === 0 ? "from-blue-500 to-indigo-600" : "from-pink-500 to-rose-600"} flex items-center justify-center font-bold text-sm shadow-xl transition-transform hover:scale-110`}
                    title={p.username}
                  >
                    {p.username[0].toUpperCase()}
                  </div>
                ))}
                {room?.players.length === 1 && (
                  <div className="w-10 h-10 rounded-full border-2 border-[#0b0f19] bg-white/5 border-dashed flex items-center justify-center text-gray-500 animate-pulse">
                    ?
                  </div>
                )}
              </div>
            </div>
          )}
          <AnimatePresence mode="wait">
            {room?.status === "waiting" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center py-20 text-center space-y-6"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
                  <div className="relative p-8 bg-gray-900/50 border border-white/10 rounded-full">
                    <User className="w-12 h-12 text-primary" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    Waiting for opponent...
                  </h2>
                  <p className="text-gray-400">
                    Share code{" "}
                    <span className="text-white font-mono bg-white/5 px-2 py-1 rounded">
                      {room.id}
                    </span>{" "}
                    to start
                  </p>
                </div>
              </motion.div>
            )}

            {room?.status === "picking" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="max-w-md mx-auto space-y-8"
              >
                <div className="text-center">
                  <h2 className="text-3xl font-black mb-2">PICK YOUR NUMBER</h2>
                  <p className="text-gray-400">
                    Range: {room.settings.min} - {room.settings.max}
                  </p>
                </div>

                {me?.secretNumber ? (
                  <div className="bg-white/5 p-8 rounded-3xl border border-white/10 text-center">
                    <p className="text-gray-400 mb-4 font-medium uppercase tracking-widest text-sm">
                      Your number is
                    </p>
                    <p className="text-6xl font-black text-primary">
                      {me.secretNumber}
                    </p>
                    <p className="mt-8 text-sm text-gray-500 animate-pulse font-medium">
                      Waiting for opponent to pick...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <input
                      type="number"
                      value={secretInput}
                      onChange={(e) => setSecretInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && setSecret()}
                      className="w-full text-center text-5xl font-black py-8 bg-white/5 border border-white/10 rounded-3xl focus:ring-4 focus:ring-primary outline-none"
                      placeholder="?"
                    />
                    <button
                      onClick={setSecret}
                      className="w-full py-5 bg-gradient-to-r from-primary to-secondary rounded-2xl font-black text-xl shadow-xl hover:shadow-primary/20 transition-all active:scale-95"
                    >
                      CONFIRM
                    </button>
                    {error && (
                      <p className="text-red-400 text-center font-bold">
                        {error}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {room?.status === "playing" && (
              <div className="grid md:grid-cols-2 gap-8">
                {/* Game Area */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div
                    className={`p-8 rounded-3xl border-2 transition-all duration-500 overflow-hidden relative ${isMyTurn ? "bg-primary/10 border-primary shadow-2xl shadow-primary/10" : "bg-white/5 border-white/10"}`}
                  >
                    {isMyTurn && (
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent animate-shimmer" />
                    )}

                    <div className="flex justify-between items-center mb-8">
                      <h3 className="font-black text-xl tracking-tight">
                        {isMyTurn ? "YOUR TURN" : "OPPONENT'S TURN"}
                      </h3>
                      {opponent && (
                        <div className="flex items-center space-x-2 bg-black/20 px-3 py-1 rounded-full">
                          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">
                            {opponent.username}
                          </span>
                        </div>
                      )}
                    </div>

                    {isMyTurn ? (
                      <div className="space-y-6">
                        <div className="relative">
                          <input
                            type="number"
                            value={guessInput}
                            onChange={(e) => setGuessInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && makeGuess()}
                            className="w-full text-center text-6xl font-black py-8 bg-black/30 border border-white/10 rounded-3xl focus:ring-4 focus:ring-primary outline-none"
                            placeholder="?"
                          />
                        </div>

                        <div className="flex space-x-4">
                          <button
                            onClick={makeGuess}
                            className="flex-1 py-4 bg-gradient-to-r from-primary to-secondary rounded-2xl font-black text-lg shadow-xl"
                          >
                            GUESS
                          </button>

                          <button
                            onClick={() => !me?.hasLied && setWillLie(!willLie)}
                            disabled={me?.hasLied}
                            className={`px-6 rounded-2xl border transition-all flex items-center justify-center ${willLie ? "bg-red-500 border-red-400 text-white" : me?.hasLied ? "opacity-30 border-white/10 grayscale" : "bg-white/5 border-white/10 hover:bg-red-500/20"}`}
                            title="Cheat once per game"
                          >
                            <ShieldAlert
                              className={`w-6 h-6 ${willLie ? "animate-bounce" : ""}`}
                            />
                            {willLie && (
                              <span className="ml-2 font-black text-xs">
                                CHEAT ACTIVE
                              </span>
                            )}
                          </button>
                        </div>
                        {me?.hasLied && (
                          <p className="text-center text-gray-500 text-xs font-bold uppercase tracking-widest italic">
                            Cheat tool used
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="py-12 flex flex-col items-center justify-center space-y-4">
                        <div className="flex space-x-2">
                          <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="w-3 h-3 bg-primary rounded-full"
                          />
                          <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{
                              repeat: Infinity,
                              duration: 1,
                              delay: 0.2,
                            }}
                            className="w-3 h-3 bg-primary rounded-full"
                          />
                          <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{
                              repeat: Infinity,
                              duration: 1,
                              delay: 0.4,
                            }}
                            className="w-3 h-3 bg-primary rounded-full"
                          />
                        </div>
                        <p className="text-sm text-gray-400 font-medium uppercase tracking-widest">
                          Waiting for {opponent?.username}...
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <Sparkles className="w-4 h-4 text-accent" />
                      <span className="text-xs font-black uppercase tracking-widest text-gray-400">
                        Your Number
                      </span>
                    </div>
                    <div className="text-4xl font-black text-white/20">
                      {me?.secretNumber}
                    </div>
                  </div>
                </motion.div>

                {/* History */}
                <div className="space-y-6">
                  <div className="bg-gray-900/50 border border-white/10 rounded-3xl flex flex-col h-[400px]">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center">
                      <span className="text-xs font-black uppercase tracking-widest text-gray-400">
                        History
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {[...(me?.guesses || []), ...(opponent?.guesses || [])]
                        .sort((a: any, b: any) => b.timestamp - a.timestamp)
                        .map((guess: any, idx: number) => {
                          const isMe = guess.playerId === socket.id;
                          return (
                            <div
                              key={idx}
                              className={`flex items-center justify-between p-3 border rounded-2xl ${
                                isMe
                                  ? "bg-primary/5 border-primary/20"
                                  : "bg-white/5 border-white/10"
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                    isMe ? "bg-primary" : "bg-accent"
                                  }`}
                                >
                                  {(isMe
                                    ? username[0]
                                    : opponent?.username[0]
                                  )?.toUpperCase()}
                                </div>
                                <span className="font-mono text-xl font-bold">
                                  {guess.value}
                                </span>
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter ${
                                  guess.feedback === "higher"
                                    ? "bg-orange-500/20 text-orange-400"
                                    : guess.feedback === "lower"
                                      ? "bg-blue-500/20 text-blue-400"
                                      : "bg-green-500/20 text-green-400"
                                }`}
                              >
                                {guess.feedback === "correct"
                                  ? "WINNER"
                                  : guess.feedback}
                              </span>
                            </div>
                          );
                        })}
                      {me?.guesses.length === 0 &&
                        opponent?.guesses.length === 0 && (
                          <div className="h-full flex items-center justify-center text-gray-600 text-sm italic">
                            No guesses yet
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {room?.status === "finished" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="p-10 bg-primary/20 rounded-full mb-8 relative">
                  <div className="absolute inset-0 bg-primary blur-3xl rounded-full opacity-20" />
                  <Trophy className="w-20 h-20 text-primary" />
                </div>
                <h2 className="text-5xl font-black mb-4">
                  {room.winner === username ? "VICTORY!" : "DEFEAT"}
                </h2>
                <p className="text-xl text-gray-400 mb-12">
                  Winner:{" "}
                  <span className="text-white font-bold">{room.winner}</span>
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-12 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold flex items-center space-x-2 transition-all"
                >
                  <Home className="w-5 h-5" />
                  <span>Back to Menu</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
