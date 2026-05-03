import { useGetDashboardStats, useGetMe } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { BrainCircuit, Activity, Trophy, ArrowRight, Flame, Target, Zap } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: user } = useGetMe();
  const { data: stats, isLoading } = useGetDashboardStats({ query: { enabled: !!user } });

  if (isLoading || !stats) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  // Format chart data
  const historyData = stats.iqHistory.map(d => ({
    date: format(new Date(d.date), 'MMM dd'),
    score: d.iqScore
  }));

  const radarData = stats.categoryBreakdown.map(c => ({
    subject: c.category.charAt(0).toUpperCase() + c.category.slice(1),
    A: c.averageScore,
    fullMark: 160,
  }));

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white uppercase tracking-wider">Intelligence Hub</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">Subject: {user?.name || 'Guest'} // ID: {user?.id}</p>
        </div>
        <Link href="/test">
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-blue font-bold tracking-wide">
            INITIATE TEST SEQUENCE
          </Button>
        </Link>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<BrainCircuit className="w-5 h-5 text-primary" />}
          label="Peak IQ"
          value={stats.bestIq.toString()}
          glow="glow-blue"
        />
        <StatCard 
          icon={<Activity className="w-5 h-5 text-secondary" />}
          label="Average IQ"
          value={stats.averageIq.toString()}
          glow=""
        />
        <StatCard 
          icon={<Flame className="w-5 h-5 text-amber-500" />}
          label="Current Streak"
          value={`${stats.currentStreak} Days`}
          glow=""
        />
        <StatCard 
          icon={<Trophy className="w-5 h-5 text-emerald-400" />}
          label="Global Rank"
          value={stats.globalRank ? `#${stats.globalRank}` : 'Unranked'}
          glow=""
        />
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Line Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-white/10"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white">Cognitive Trajectory</h3>
          </div>
          <div className="h-[300px] w-full">
            {historyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 10', 'dataMax + 10']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(10,10,20,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#00F0FF', fontWeight: 'bold' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#00F0FF" 
                    strokeWidth={3}
                    dot={{ fill: '#00F0FF', r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#00F0FF', stroke: '#fff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground border border-dashed border-white/10 rounded-xl">
                Insufficient data for trajectory mapping
              </div>
            )}
          </div>
        </motion.div>

        {/* Radar Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col"
        >
          <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-2">Domain Competency</h3>
          <div className="flex-1 min-h-[250px] w-full relative">
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 160]} tick={false} axisLine={false} />
                  <Radar name="Score" dataKey="A" stroke="#B000FF" fill="#B000FF" fillOpacity={0.3} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(10,10,20,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                No domain data available
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Tests */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass p-6 rounded-2xl border border-white/10"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white">Recent Assessments</h3>
          <Link href="/profile" className="text-xs text-primary hover:text-primary/80 uppercase tracking-widest font-bold flex items-center">
            View All <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </div>

        <div className="space-y-3">
          {stats.recentTests.length > 0 ? stats.recentTests.map((test) => (
            <Link key={test.id} href={`/results/${test.id}`}>
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-black border border-white/10 flex items-center justify-center shrink-0">
                    <Target className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <div className="font-bold text-white mb-1 uppercase text-sm tracking-wider">{test.category} - {test.difficulty}</div>
                    <div className="text-xs text-muted-foreground font-mono">{format(new Date(test.completedAt), 'PPp')}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-display font-bold text-primary">{test.iqScore}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">{test.iqLevel.replace('_', ' ')}</div>
                </div>
              </div>
            </Link>
          )) : (
            <div className="text-center py-8 text-muted-foreground bg-white/5 rounded-xl border border-dashed border-white/10">
              No recent assessments found.
            </div>
          )}
        </div>
      </motion.div>

    </div>
  );
}

function StatCard({ icon, label, value, glow }: { icon: React.ReactNode, label: string, value: string, glow: string }) {
  return (
    <div className={`glass p-5 rounded-2xl border border-white/10 relative overflow-hidden ${glow}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">{label}</span>
      </div>
      <div className="text-3xl font-display font-bold text-white">{value}</div>
    </div>
  );
}
