import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Clock, Medal, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import socket from "../socket";

export default function Leaderboard({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"wins" | "losses">("wins");

  useEffect(() => {
    socket.emit("game:leaderboard", (res: any) => {
      if (res?.leaderboard) {
        setLeaderboard(res.leaderboard);
      }
      setLoading(false);
    });
  }, []);

  const sortedLeaderboard = [...leaderboard].sort((a, b) =>
    activeTab === "wins" ? b.wins - a.wins : b.losses - a.losses,
  );

  const top3 = sortedLeaderboard.slice(0, 3);
  const rest = sortedLeaderboard.slice(3);

  const PodiumItem = ({ player, rank }: { player: any; rank: number }) => {
    const isFirst = rank === 1;
    const isSecond = rank === 2;

    const heightClass = isFirst ? "h-48" : isSecond ? "h-36" : "h-28";
    const colorClass = isFirst
      ? "bg-gradient-to-t from-yellow-400/5 to-yellow-400/20 border-yellow-400/50 text-yellow-400"
      : isSecond
        ? "bg-gradient-to-t from-gray-300/5 to-gray-300/20 border-gray-300/50 text-gray-300"
        : "bg-gradient-to-t from-amber-600/5 to-amber-600/20 border-amber-600/50 text-amber-600";

    const delay = rank === 1 ? 0.3 : rank === 2 ? 0.1 : 0.5;
    const metricValue = activeTab === "wins" ? player.wins : player.losses;

    return (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, type: "spring", stiffness: 100 }}
        className="flex flex-col items-center flex-1 max-w-[120px]"
      >
        <div className="mb-4 text-center">
          <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 bg-[#111] border-2 border-white/10 relative shadow-xl">
            <Medal
              size={24}
              className={
                isFirst
                  ? "text-yellow-400"
                  : isSecond
                    ? "text-gray-300"
                    : "text-amber-600"
              }
            />
          </div>
          <div className="font-bold text-white text-sm sm:text-lg w-full truncate overflow-hidden text-ellipsis px-1">
            {player.username}
          </div>
          <div className="text-xl font-black text-[var(--accent-color)] mt-1">
            {metricValue}
          </div>
        </div>
        <div
          className={`w-full ${heightClass} ${colorClass} rounded-t-2xl border-t-2 border-l border-r flex justify-center pt-4 relative overflow-hidden backdrop-blur-sm shadow-[0_-10px_30px_rgba(0,0,0,0.5)]`}
        >
          <span className="text-5xl font-black opacity-30 select-none">
            {rank}
          </span>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="fixed inset-0 bg-[#0b0f19] z-50 flex flex-col p-6 animate-in fade-in duration-300 w-full h-full pb-20 overflow-y-auto">
      <div className="flex items-center justify-between mb-6 max-w-3xl mx-auto w-full">
        <button
          onClick={onClose}
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-widest flex items-center gap-3">
          <Trophy className="text-yellow-400" size={32} />
          {t("landing.leaderboard", "Classifica Globale")}
        </h2>
        <div className="w-12" />
      </div>

      <div className="max-w-3xl mx-auto w-full mb-8 flex gap-4">
        <button
          onClick={() => setActiveTab("wins")}
          className={`flex-1 py-3 rounded-2xl font-bold transition-all ${activeTab === "wins" ? "bg-[var(--accent-color)] text-black" : "bg-white/5 text-white/50 hover:bg-white/10"}`}
        >
          {t("leaderboard.mostWins", "Più Vittorie")}
        </button>
        <button
          onClick={() => setActiveTab("losses")}
          className={`flex-1 py-3 rounded-2xl font-bold transition-all ${activeTab === "losses" ? "bg-red-500 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"}`}
        >
          {t("leaderboard.mostLosses", "Più Sconfitte")}
        </button>
      </div>

      <div className="max-w-3xl mx-auto w-full space-y-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin text-[var(--accent-color)]">
              <Clock size={32} />
            </div>
          </div>
        ) : sortedLeaderboard.length === 0 ? (
          <div className="text-center py-20 text-white/50 bg-white/5 rounded-3xl border border-white/5 mt-10">
            {t("landing.emptyLeaderboard", "Nessun dato")}
          </div>
        ) : (
          <>
            <div className="flex justify-center items-end gap-2 sm:gap-6 mt-10 mb-12">
              {top3[1] && <PodiumItem player={top3[1]} rank={2} />}
              {top3[0] && <PodiumItem player={top3[0]} rank={1} />}
              {top3[2] && <PodiumItem player={top3[2]} rank={3} />}
            </div>

            <div className="space-y-3 pb-8">
              <AnimatePresence mode="popLayout">
                {rest.map((player, index) => {
                  const actualRank = index + 4;
                  return (
                    <motion.div
                      key={player.username + activeTab}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl p-4 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl bg-white/5 text-white/50 border border-white/5">
                          #{actualRank}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-white">
                            {player.username}
                          </h3>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xl sm:text-2xl font-black text-[var(--accent-color)]">
                          {activeTab === "wins" ? player.wins : player.losses}
                        </div>
                        <div className="text-[9px] sm:text-[10px] font-bold tracking-widest uppercase text-white/30 truncate">
                          {activeTab === "wins"
                            ? t("leaderboard.wins", "Vittorie")
                            : t("leaderboard.losses", "Sconfitte")}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
