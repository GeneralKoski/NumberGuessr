import { AnimatePresence, motion } from "framer-motion";
import { Play, Plus, Search, Trophy, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import socket from "../socket";
import Leaderboard from "./Leaderboard";

interface LandingProps {
  onJoinLobby: (
    name: string,
    roomId?: string,
    isCreating?: boolean,
    isPublic?: boolean,
    minRange?: number,
    maxRange?: number,
  ) => Promise<{ error?: string } | void>;
}

export default function Landing({ onJoinLobby }: LandingProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(
    () => localStorage.getItem("numberguessr_name") || "",
  );
  const [code, setCode] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [minRange, setMinRange] = useState(1);
  const [maxRange, setMaxRange] = useState(100);
  const [publicLobbies, setPublicLobbies] = useState<any[]>([]);
  const [errors, setErrors] = useState<{
    name?: string;
    code?: string;
    general?: string;
  }>({});

  const [view, setView] = useState<"list" | "create" | "join" | "leaderboard">(
    "list",
  );

  useEffect(() => {
    socket.emit("lobby:list", (lobbies: any[]) => {
      setPublicLobbies(lobbies || []);
    });

    const handleUpdate = (lobbies: any[]) => setPublicLobbies(lobbies || []);
    socket.on("lobbies:update", handleUpdate);
    return () => {
      socket.off("lobbies:update", handleUpdate);
    };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim())
      return setErrors({ name: t("error.nameRequired", "Name required") });
    setErrors({});

    localStorage.setItem("numberguessr_name", name.trim());
    const res = await onJoinLobby(
      name.trim(),
      undefined,
      true,
      isPublic,
      minRange,
      maxRange,
    );

    if (res?.error) {
      if (res.error === "Room already exists") {
        setErrors({ general: t("error.roomExists", "Room already exists") });
      } else {
        setErrors({ general: res.error });
      }
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: any = {};
    if (!name.trim()) newErrors.name = t("error.nameRequired", "Name required");
    if (!code.trim())
      newErrors.code = t("error.lobbyNotFound", "Code required");
    if (Object.keys(newErrors).length > 0) return setErrors(newErrors);

    setErrors({});

    localStorage.setItem("numberguessr_name", name.trim());

    const res = await onJoinLobby(name.trim(), code.toUpperCase(), false);
    if (res?.error) {
      if (res.error === "Name already taken in this lobby") {
        setErrors({ name: t("error.nameTaken", "Name already taken") });
      } else if (res.error === "Lobby not found") {
        setErrors({ code: t("error.lobbyNotFound", "Lobby not found") });
      } else if (res.error === "Lobby full") {
        setErrors({ code: t("error.lobbyFull", "Lobby full") });
      } else {
        setErrors({ general: res.error });
      }
    }
  };

  const openJoinModal = (lobbyCode?: string) => {
    if (lobbyCode) setCode(lobbyCode);
    setErrors({});
    setView("join");
  };

  const openCreateModal = () => {
    setErrors({});
    setView("create");
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 relative">
      <div className="flex flex-col md:flex-row gap-12 items-center md:items-start">
        {/* Left Column */}
        <div className="flex-1 w-full text-center md:text-left">
          <div className="mb-10">
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-white mb-4 tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50">
              {t("landing.welcome", "Benvenuto in NumberGuessr!")}
            </h1>
            <p className="text-white/50 text-base md:text-lg tracking-wide max-w-sm mx-auto md:mx-0">
              {t("landing.subtitle", "Crea una lobby o unisciti per giocare.")}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={openCreateModal}
                className="flex-1 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-black font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-105 cursor-pointer shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)]"
              >
                <Plus size={24} />
                <span className="text-lg">{t("lobby.create")}</span>
              </button>
              <button
                onClick={() => openJoinModal()}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-105 cursor-pointer backdrop-blur-sm"
              >
                <Search size={24} />
                <span className="text-lg">{t("lobby.join")}</span>
              </button>
            </div>

            <button
              onClick={() => {
                setErrors({});
                setView("leaderboard");
              }}
              className="w-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-500 font-bold py-4 px-8 rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Trophy size={24} />
              <span className="text-lg">
                {t("landing.leaderboard", "Classifica Globale")}
              </span>
            </button>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex-1 w-full max-w-md mx-auto md:max-w-none">
          <div className="bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 min-h-[300px] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent-color)]/10 blur-[100px] rounded-full pointer-events-none" />

            <h2 className="text-sm font-bold text-white/50 mb-6 uppercase tracking-wider flex items-center gap-2">
              <Users size={18} />
              {t("landing.publicLobbies", "Lobby Pubbliche")}
            </h2>

            {publicLobbies.length === 0 ? (
              <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                <p className="text-sm text-white/40">
                  {t(
                    "landing.noPublicLobbies",
                    "Nessuna lobby pubblica disponibile",
                  )}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {publicLobbies.map((lobby) => (
                    <motion.div
                      key={lobby.code}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="group flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl px-5 py-4 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-xl text-[var(--accent-color)] font-black tracking-widest">
                            {lobby.code}
                          </span>
                          <span className="text-[10px] font-bold text-white/50 bg-white/5 px-2.5 py-1 rounded-full uppercase tracking-wider">
                            {lobby.playerCount}{" "}
                            {t("landing.players", "Giocatori")}
                          </span>
                        </div>
                        <div className="text-xs text-white/50">
                          {t("landing.hostedBy", "Host")}:{" "}
                          <span className="text-white/80 font-medium">
                            {lobby.hostName}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => openJoinModal(lobby.code)}
                        className="w-12 h-12 rounded-xl bg-[var(--accent-color)]/10 text-[var(--accent-color)] flex items-center justify-center hover:bg-[var(--accent-color)] hover:text-black transition-colors cursor-pointer"
                      >
                        <Play size={20} className="ml-1" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {view === "leaderboard" && (
          <Leaderboard onClose={() => setView("list")} />
        )}
        {(view === "create" || view === "join") && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-md"
          >
            <div className="bg-[#0b0f19] border border-white/10 w-full max-w-sm rounded-3xl p-8 relative shadow-2xl">
              <button
                onClick={() => setView("list")}
                className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors cursor-pointer"
              >
                <X size={24} />
              </button>

              <h2 className="text-3xl font-black text-white mb-8">
                {view === "create" ? t("lobby.create") : t("lobby.join")}
              </h2>

              {errors.general && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-4 rounded-2xl mb-6 text-center shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                >
                  <span className="font-bold tracking-wide">
                    {errors.general}
                  </span>
                </motion.div>
              )}

              <form onSubmit={view === "create" ? handleCreate : handleJoin}>
                <div className="mb-5">
                  <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-wide">
                    {t("lobby.namePlaceholder")}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name)
                        setErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    placeholder="Es. Mario"
                    maxLength={15}
                    className={`w-full bg-[#111] border ${errors.name ? "border-red-500/50 focus:border-red-400 focus:ring-red-400" : "border-white/10 focus:border-[var(--accent-color)] focus:ring-[var(--accent-color)]"} rounded-2xl px-5 py-4 text-white placeholder-white/30 text-base font-medium focus:outline-none focus:ring-1 transition-all`}
                    autoFocus
                  />
                  {errors.name && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-sm font-bold mt-2 ml-2"
                    >
                      {errors.name}
                    </motion.p>
                  )}
                </div>

                {view === "join" && (
                  <div className="mb-8">
                    <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-wide">
                      {t("lobby.codePlaceholder", "Codice Lobby")}
                    </label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value.toUpperCase());
                        if (errors.code)
                          setErrors((prev) => ({ ...prev, code: undefined }));
                      }}
                      placeholder="XXXXXX"
                      maxLength={6}
                      className={`w-full bg-[#111] border ${errors.code ? "border-red-500/50 focus:border-red-400 focus:ring-red-400" : "border-white/10 focus:border-[var(--accent-color)] focus:ring-[var(--accent-color)]"} rounded-2xl px-5 py-4 text-[var(--accent-color)] placeholder-white/20 text-xl font-black tracking-[0.3em] focus:outline-none focus:ring-1 transition-all uppercase`}
                    />
                    {errors.code && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-sm font-bold mt-2 ml-2"
                      >
                        {errors.code}
                      </motion.p>
                    )}
                  </div>
                )}

                {view === "create" && (
                  <div className="mb-8 space-y-4">
                    <div className="flex items-center gap-6 pt-2">
                      <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer hover:text-white transition-colors font-medium">
                        <input
                          type="radio"
                          checked={isPublic}
                          onChange={() => setIsPublic(true)}
                          className="accent-[var(--accent-color)] w-4 h-4"
                        />
                        {t("landing.publicLobby", "Pubblica")}
                      </label>
                      <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer hover:text-white transition-colors font-medium">
                        <input
                          type="radio"
                          checked={!isPublic}
                          onChange={() => setIsPublic(false)}
                          className="accent-[var(--accent-color)] w-4 h-4"
                        />
                        {t("landing.privateLobby", "Privata")}
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-wide">
                          {t("lobby.min")}
                        </label>
                        <input
                          type="number"
                          value={minRange}
                          onChange={(e) =>
                            setMinRange(parseInt(e.target.value))
                          }
                          className="w-full px-4 py-2 bg-[#111] border border-white/10 rounded-xl focus:ring-2 focus:ring-[var(--accent-color)] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-wide">
                          {t("lobby.max")}
                        </label>
                        <input
                          type="number"
                          value={maxRange}
                          onChange={(e) =>
                            setMaxRange(parseInt(e.target.value))
                          }
                          className="w-full px-4 py-2 bg-[#111] border border-white/10 rounded-xl focus:ring-2 focus:ring-[var(--accent-color)] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-black text-lg font-black py-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                >
                  {view === "create" ? t("lobby.create") : t("lobby.join")}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
