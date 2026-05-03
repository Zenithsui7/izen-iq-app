import { useState } from "react";
import { useGetLeaderboard, useGetGlobalStats } from "@workspace/api-client-react";
import { GetLeaderboardPeriod } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Trophy, Globe, Activity, Users, Medal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Leaderboard() {
  const [period, setPeriod] = useState<GetLeaderboardPeriod>("weekly");
  const { data: leaderboard, isLoading } = useGetLeaderboard({ query: { queryKey: ['leaderboard', period] } });
  const { data: globalStats } = useGetGlobalStats();

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8">
      
      {/* Header & Global Stats */}
      <div className="mb-10">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white uppercase tracking-tight mb-6 flex items-center gap-4">
          <Globe className="w-10 h-10 text-primary" /> Global Rankings
        </h1>
        
        {globalStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass p-4 rounded-xl border border-white/10">
              <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1 font-bold">Total Subjects</div>
              <div className="text-2xl font-display font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> {globalStats.totalUsers.toLocaleString()}
              </div>
            </div>
            <div className="glass p-4 rounded-xl border border-white/10">
              <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1 font-bold">Tests Conducted</div>
              <div className="text-2xl font-display font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-secondary" /> {globalStats.totalTests.toLocaleString()}
              </div>
            </div>
            <div className="glass p-4 rounded-xl border border-white/10">
              <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1 font-bold">Global Average</div>
              <div className="text-2xl font-display font-bold text-white">{globalStats.averageIq}</div>
            </div>
            <div className="glass p-4 rounded-xl border border-white/10 glow-blue">
              <div className="text-xs text-primary uppercase tracking-widest mb-1 font-bold">Absolute Peak</div>
              <div className="text-2xl font-display font-bold text-white">{globalStats.topIq}</div>
            </div>
          </div>
        )}
      </div>

      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
        {/* Controls */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex bg-black/50 p-1 rounded-lg border border-white/5">
            <button
              onClick={() => setPeriod("weekly")}
              className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${
                period === "weekly" ? 'bg-primary text-primary-foreground shadow-[0_0_10px_rgba(0,240,255,0.3)]' : 'text-muted-foreground hover:text-white'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setPeriod("alltime")}
              className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${
                period === "alltime" ? 'bg-secondary text-secondary-foreground shadow-[0_0_10px_rgba(176,0,255,0.3)]' : 'text-muted-foreground hover:text-white'
              }`}
            >
              All Time
            </button>
          </div>
        </div>

        {/* List */}
        <div className="p-0">
          {isLoading ? (
            <div className="py-20 flex justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            </div>
          ) : leaderboard && leaderboard.length > 0 ? (
            <div className="divide-y divide-white/5">
              {leaderboard.map((entry, index) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={entry.userId}
                  className="flex items-center p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="w-12 text-center font-display font-bold text-xl mr-4 flex justify-center">
                    {entry.rank === 1 ? <Medal className="w-8 h-8 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" /> :
                     entry.rank === 2 ? <Medal className="w-8 h-8 text-zinc-300 drop-shadow-[0_0_10px_rgba(212,212,216,0.5)]" /> :
                     entry.rank === 3 ? <Medal className="w-8 h-8 text-amber-700 drop-shadow-[0_0_10px_rgba(180,83,9,0.5)]" /> :
                     <span className="text-muted-foreground">#{entry.rank}</span>}
                  </div>
                  
                  <Avatar className="h-12 w-12 border-2 border-white/10 mr-4">
                    <AvatarImage src={entry.avatarUrl || ''} />
                    <AvatarFallback className="bg-black text-primary font-mono">{entry.name.substring(0,2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="font-bold text-white text-lg">{entry.name}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">{entry.iqLevel.replace('_', ' ')}</div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                      {entry.iqScore}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">{entry.totalTests} tests</div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-muted-foreground">
              No ranking data available for this period.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
