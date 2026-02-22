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
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./components/LanguageSwitcher";
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
  const { t } = useTranslation();
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
  const [copied, setCopied] = useState(false);

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
      alert(t("error.opponentLeft"));
      window.location.reload();
    });

    return () => {
      socket.off("room-joined");
      socket.off("room-update");
      socket.off("error");
      socket.off("player-left");
    };
  }, [t]);

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
        t("error.range", { min: room!.settings.min, max: room!.settings.max }),
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

  const copyRoomId = () => {
    if (room?.id) {
      navigator.clipboard.writeText(room.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-[var(--accent-color)] rounded-2xl">
                <Hash className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-[var(--accent-color)] to-[var(--accent-hover)] bg-clip-text text-transparent italic tracking-tighter">
                {t("appName")}
              </h1>
            </div>
            <LanguageSwitcher />
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black text-gray-400 mb-2 ml-1 uppercase tracking-widest">
                {t("lobby.yourName")}
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-[var(--accent-color)] outline-none transition-all"
                  placeholder={t("lobby.namePlaceholder")}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 mb-2 ml-1 uppercase tracking-widest">
                {t("lobby.lobbyId")}
              </label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-[var(--accent-color)] outline-none transition-all font-mono"
                  placeholder={t("lobby.codePlaceholder")}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-gray-400 mb-2 ml-1 uppercase tracking-widest">
                  {t("lobby.min")}
                </label>
                <input
                  type="number"
                  value={minRange}
                  onChange={(e) => setMinRange(parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-[var(--accent-color)] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 mb-2 ml-1 uppercase tracking-widest">
                  {t("lobby.max")}
                </label>
                <input
                  type="number"
                  value={maxRange}
                  onChange={(e) => setMaxRange(parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-[var(--accent-color)] outline-none"
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
                className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95 cursor-pointer"
              >
                {t("lobby.join")}
              </button>
              <button
                onClick={createRoom}
                className="flex-1 py-4 bg-gradient-to-r from-[var(--accent-color)] to-[var(--accent-hover)] hover:shadow-lg hover:shadow-[var(--accent-color)]/20 rounded-2xl font-black uppercase tracking-widest text-sm text-[#0b0f19] transition-all active:scale-95 cursor-pointer"
              >
                {t("lobby.create")}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col selection:bg-[var(--accent-color)] selection:text-black">
      {/* Header matching KosQuiz style */}
      <header className="relative flex items-center justify-between px-8 py-6 border-b border-white/5 bg-[#0b0f19]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="w-32" /> {/* Spacer to center title */}
        <button
          onClick={() => window.location.reload()}
          className="text-3xl font-black tracking-tighter uppercase cursor-pointer text-[var(--accent-color)] hover:text-[var(--accent-hover)] transition-all italic hover:scale-105 active:scale-95"
        >
          {t("appName")}
        </button>
        <div className="w-32 flex justify-end">
          <LanguageSwitcher />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start p-4 md:p-8 max-w-5xl mx-auto w-full">
        <div className="w-full flex flex-col space-y-8 pb-20">
          <div className="flex flex-col sm:flex-row justify-between items-center bg-[#111]/80 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl gap-6">
            <div className="flex items-center space-x-6">
              <div className="p-3 bg-[var(--accent-color)]/10 rounded-2xl text-[var(--accent-color)] border border-[var(--accent-color)]/20 shadow-lg shadow-[var(--accent-color)]/5">
                <Swords className="w-7 h-7" />
              </div>
              <div>
                <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em] mb-1">
                  {t("lobby.status")}
                </p>
                <div
                  onClick={copyRoomId}
                  className="flex items-center gap-2 group cursor-pointer"
                >
                  <span className="font-mono font-black text-2xl text-white group-hover:text-[var(--accent-color)] transition-colors">
                    {room?.id}
                  </span>
                  <div
                    className={`p-1 rounded bg-white/5 group-hover:bg-[var(--accent-color)] group-hover:text-black transition-all ${copied ? "bg-green-500 text-black" : "text-white/30"}`}
                  >
                    <Hash size={14} />
                  </div>
                  {copied && (
                    <span className="text-[10px] font-black text-green-400 animate-bounce ml-2 uppercase">
                      {t("lobby.copied")}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex -space-x-4 items-center">
              {room?.players.map((p, i) => (
                <div key={p.id} className={`relative group`} title={p.username}>
                  <div
                    className={`w-12 h-12 rounded-2xl border-2 border-[#0b0f19] bg-gradient-to-br ${i === 0 ? "from-blue-500 to-indigo-600" : "from-pink-500 to-rose-600"} flex items-center justify-center font-black text-lg shadow-xl transition-all group-hover:scale-110 group-hover:-translate-y-1 relative z-10`}
                  >
                    {p.username[0].toUpperCase()}
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4/5 h-2 bg-black/50 blur-md rounded-full -z-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
              {room?.players.length === 1 && (
                <div className="w-12 h-12 rounded-2xl border-2 border-[#0b0f19] bg-white/5 border-dashed flex items-center justify-center text-white/20 animate-pulse font-black">
                  ?
                </div>
              )}
            </div>
          </div>
          <AnimatePresence mode="wait">
            {room?.status === "waiting" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center py-20 text-center space-y-6"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-[var(--accent-color)]/20 blur-3xl rounded-full animate-pulse" />
                  <div className="relative p-8 bg-[#111]/50 border border-white/10 rounded-full">
                    <User className="w-12 h-12 text-[var(--accent-color)]" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-black mb-2 uppercase tracking-tight">
                    {t("lobby.waitingOpponent")}
                  </h2>
                  <p className="text-gray-400">
                    {t("lobby.shareCode", { code: room.id })}
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
                  <h2 className="text-3xl font-black mb-2 tracking-tighter uppercase italic">
                    {t("picking.title")}
                  </h2>
                  <p className="text-gray-400 font-mono text-sm">
                    {t("picking.range", {
                      min: room.settings.min,
                      max: room.settings.max,
                    })}
                  </p>
                </div>

                {me?.secretNumber ? (
                  <div className="bg-[#111]/80 backdrop-blur-xl p-10 rounded-3xl border border-white/10 text-center shadow-2xl">
                    <p className="text-white/30 mb-4 font-black uppercase tracking-[0.2em] text-[10px]">
                      {t("picking.yourNumber")}
                    </p>
                    <p className="text-7xl font-black text-[var(--accent-color)]">
                      {me.secretNumber}
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[var(--accent-color)] animate-ping" />
                      <p className="text-sm text-white/40 font-bold uppercase tracking-widest">
                        {t("picking.opponentThinking")}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <input
                      type="number"
                      value={secretInput}
                      onChange={(e) => setSecretInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && setSecret()}
                      className="w-full text-center text-6xl font-black py-10 bg-white/5 border border-white/10 rounded-3xl focus:ring-4 focus:ring-[var(--accent-color)] outline-none transition-all placeholder:text-white/5"
                      placeholder={t("picking.placeholder")}
                    />
                    <button
                      onClick={setSecret}
                      className="w-full py-5 bg-gradient-to-r from-[var(--accent-color)] to-[var(--accent-hover)] rounded-2xl font-black text-xl text-[#0b0f19] shadow-xl hover:shadow-[var(--accent-color)]/20 transition-all active:scale-95 cursor-pointer uppercase tracking-widest"
                    >
                      {t("picking.confirm")}
                    </button>
                    {error && (
                      <p className="text-red-400 text-center font-bold animate-shake">
                        {error}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {room?.status === "playing" && (
              <div className="grid md:grid-cols-2 gap-8 items-start w-full">
                {/* Game Area */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div
                    className={`p-10 rounded-3xl border-2 transition-all duration-500 overflow-hidden relative shadow-2xl ${isMyTurn ? "bg-[var(--accent-color)]/5 border-[var(--accent-color)]/30" : "bg-[#111]/80 border-white/5"}`}
                  >
                    {isMyTurn && (
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--accent-color)] to-[var(--accent-hover)] animate-pulse" />
                    )}

                    <div className="flex justify-between items-center mb-10">
                      <h3 className="font-black text-sm tracking-[0.2em] text-white/40 uppercase">
                        {isMyTurn ? t("game.yourTurn") : t("game.opponentTurn")}
                      </h3>
                      {opponent && (
                        <div className="flex items-center space-x-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                          <div
                            className={`w-2 h-2 rounded-full ${isMyTurn ? "bg-white/20" : "bg-accent animate-pulse shadow-[0_0_10px_var(--accent-color)]"}`}
                          />
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">
                            {opponent.username}
                          </span>
                        </div>
                      )}
                    </div>

                    {isMyTurn ? (
                      <div className="space-y-8">
                        <div className="relative">
                          <input
                            type="number"
                            value={guessInput}
                            onChange={(e) => setGuessInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && makeGuess()}
                            className="w-full text-center text-7xl font-black py-10 bg-black/30 border border-white/10 rounded-3xl focus:ring-4 focus:ring-[var(--accent-color)] outline-none placeholder:text-white/5"
                            placeholder="00"
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                          <button
                            onClick={makeGuess}
                            className="flex-3 py-5 bg-gradient-to-r from-[var(--accent-color)] to-[var(--accent-hover)] rounded-2xl font-black text-xl text-[#0b0f19] shadow-xl hover:shadow-[var(--accent-color)]/20 transition-all active:scale-95 cursor-pointer uppercase tracking-widest"
                          >
                            {t("game.guess")}
                          </button>

                          <button
                            onClick={() => !me?.hasLied && setWillLie(!willLie)}
                            disabled={me?.hasLied}
                            className={`flex-1 px-6 rounded-2xl border transition-all flex items-center justify-center gap-2 group ${willLie ? "bg-red-500 border-red-400 text-white" : me?.hasLied ? "opacity-30 border-white/10 grayscale cursor-not-allowed" : "bg-white/5 border-white/10 hover:bg-red-500/20 cursor-pointer"}`}
                            title="Cheat once per game"
                          >
                            <ShieldAlert
                              className={`w-6 h-6 ${willLie ? "animate-bounce" : "group-hover:scale-110"}`}
                            />
                            {willLie && (
                              <span className="font-black text-[10px] uppercase tracking-tighter">
                                {t("game.lying")}
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-20 flex flex-col items-center justify-center space-y-6">
                        <div className="flex space-x-3">
                          <motion.div
                            animate={{
                              scale: [1, 1.5, 1],
                              opacity: [0.5, 1, 0.5],
                            }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="w-3 h-3 bg-[var(--accent-color)] rounded-full"
                          />
                          <motion.div
                            animate={{
                              scale: [1, 1.5, 1],
                              opacity: [0.5, 1, 0.5],
                            }}
                            transition={{
                              repeat: Infinity,
                              duration: 1.5,
                              delay: 0.3,
                            }}
                            className="w-3 h-3 bg-[var(--accent-color)] rounded-full"
                          />
                          <motion.div
                            animate={{
                              scale: [1, 1.5, 1],
                              opacity: [0.5, 1, 0.5],
                            }}
                            transition={{
                              repeat: Infinity,
                              duration: 1.5,
                              delay: 0.6,
                            }}
                            className="w-3 h-3 bg-[var(--accent-color)] rounded-full"
                          />
                        </div>
                        <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.3em] animate-pulse">
                          {t("game.opponentPlaying")}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Sparkles className="w-4 h-4 text-[var(--accent-color)]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                          {t("game.yourSecretNumber")}
                        </span>
                      </div>
                      <div className="text-4xl font-black text-white/80">
                        {me?.secretNumber}
                      </div>
                    </div>
                    <div className="hidden sm:block p-4 border border-white/5 rounded-2xl bg-white/5 group transition-all hover:bg-[var(--accent-color)]/10">
                      <ShieldAlert className="w-6 h-6 text-white/10 group-hover:text-[var(--accent-color)]" />
                    </div>
                  </div>
                </motion.div>

                {/* History */}
                <div className="space-y-6 w-full">
                  <div className="bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-3xl flex flex-col h-[600px] shadow-2xl">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                        {t("game.history")}
                      </span>
                      <div className="text-[10px] bg-white/5 px-3 py-1 rounded-full text-white/30 font-bold">
                        {t("game.totalGuesses", {
                          count: room?.players.reduce(
                            (acc, p) => acc + p.guesses.length,
                            0,
                          ),
                        })}
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
                      {[...(me?.guesses || []), ...(opponent?.guesses || [])]
                        .sort((a: any, b: any) => b.timestamp - a.timestamp)
                        .map((guess: any, idx: number) => {
                          const isMe = guess.playerId === socket.id;
                          return (
                            <motion.div
                              initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              key={idx}
                              className={`flex items-center justify-between p-4 border-2 rounded-2xl transition-all ${
                                isMe
                                  ? "bg-[var(--accent-color)]/5 border-[var(--accent-color)]/20"
                                  : "bg-white/5 border-white/5"
                              }`}
                            >
                              <div className="flex items-center space-x-4">
                                <div
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shadow-lg ${
                                    isMe
                                      ? "bg-[var(--accent-color)] text-[#0b0f19] shadow-[var(--accent-color)]/20"
                                      : "bg-white/10 text-white shadow-black/50"
                                  }`}
                                >
                                  {(isMe
                                    ? username[0]
                                    : opponent?.username[0]
                                  )?.toUpperCase()}
                                </div>
                                <span className="font-black text-3xl tabular-nums">
                                  {guess.value}
                                </span>
                              </div>
                              <span
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                                  guess.feedback === "higher"
                                    ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                                    : guess.feedback === "lower"
                                      ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                      : "bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                                }`}
                              >
                                {guess.feedback === "correct"
                                  ? t("game.winnerBadge")
                                  : t(`game.${guess.feedback}`)}
                              </span>
                            </motion.div>
                          );
                        })}
                      {me?.guesses.length === 0 &&
                        opponent?.guesses.length === 0 && (
                          <div className="h-full flex flex-col items-center justify-center text-white/20 text-center">
                            <Hash size={48} className="mb-4 opacity-10" />
                            <p className="text-sm font-bold uppercase tracking-widest italic">
                              {t("game.noGuesses")}
                            </p>
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
                className="flex flex-col items-center justify-center py-20 text-center w-full"
              >
                <div className="p-16 bg-[var(--accent-color)]/10 rounded-full mb-10 relative">
                  <div className="absolute inset-0 bg-[var(--accent-color)] blur-[100px] rounded-full opacity-20" />
                  <Trophy className="w-24 h-24 text-[var(--accent-color)] relative z-10 filter drop-shadow-[0_0_20px_var(--accent-color)]" />
                </div>
                <h2 className="text-7xl font-black mb-6 italic tracking-tighter bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
                  {room.winner === username
                    ? t("end.victory")
                    : t("end.defeat")}
                </h2>
                <div className="flex items-center gap-4 mb-16 bg-white/5 px-8 py-4 rounded-2xl border border-white/10">
                  <Sparkles className="text-[var(--accent-color)]" />
                  <p className="text-2xl text-white font-bold uppercase tracking-widest">
                    {t("end.winner", { winner: room.winner })}
                  </p>
                  <Sparkles className="text-[var(--accent-color)]" />
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="px-16 py-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm flex items-center space-x-4 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xl"
                >
                  <Home className="w-6 h-6" />
                  <span>{t("end.mainMenu")}</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
