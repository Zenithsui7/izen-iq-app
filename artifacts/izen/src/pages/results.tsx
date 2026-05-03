import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { useGetTest } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Share2, BrainCircuit, Zap, Target, ArrowRight } from "lucide-react";
import { TestResultIqLevel } from "@workspace/api-client-react";

export default function Results() {
  const params = useParams();
  const testId = Number(params.testId);
  const { data: result, isLoading } = useGetTest(testId, { query: { enabled: !!testId } });
  
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    if (!result) return;
    
    // Animate score counter
    const duration = 2000; // 2 seconds
    const steps = 60;
    const stepTime = duration / steps;
    const increment = result.iqScore / steps;
    
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= result.iqScore) {
        setDisplayScore(result.iqScore);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(current));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [result]);

  if (isLoading || !result) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  const getLevelConfig = (level: string) => {
    switch (level) {
      case TestResultIqLevel.genius:
        return { color: "text-amber-400", glow: "glow-amber", bg: "bg-amber-400/10", border: "border-amber-400/30" };
      case TestResultIqLevel.gifted:
        return { color: "text-secondary", glow: "glow-violet", bg: "bg-secondary/10", border: "border-secondary/30" };
      case TestResultIqLevel.above_average:
        return { color: "text-primary", glow: "glow-blue", bg: "bg-primary/10", border: "border-primary/30" };
      default:
        return { color: "text-emerald-400", glow: "", bg: "bg-emerald-400/10", border: "border-emerald-400/30" };
    }
  };

  const config = getLevelConfig(result.iqLevel);

  const getMotivationalMessage = (level: string) => {
    switch (level) {
      case TestResultIqLevel.genius: return "The data doesn't lie — you're exceptional.";
      case TestResultIqLevel.gifted: return "A brilliant mind. Keep pushing the boundaries.";
      case TestResultIqLevel.above_average: return "Your mind is evolving. Strong cognitive foundation.";
      default: return "Genius is built, not born. Keep training.";
    }
  };

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 pt-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Score Area */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-7 glass-panel p-8 md:p-12 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]"
        >
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)]" />
          
          <div className="text-center relative z-10">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Cognitive Quotient</h2>
            <div className={`text-8xl md:text-[150px] font-display font-bold leading-none tracking-tighter mb-6 ${config.color} text-glow drop-shadow-[0_0_30px_currentColor]`}>
              {displayScore}
            </div>
            
            <div className={`inline-flex items-center px-4 py-1.5 rounded-full border ${config.border} ${config.bg} ${config.color} text-sm font-bold uppercase tracking-widest mb-8`}>
              {result.iqLevel.replace('_', ' ')}
            </div>

            <p className="text-xl font-serif text-white/80 italic max-w-md mx-auto">
              "{getMotivationalMessage(result.iqLevel)}"
            </p>
          </div>
        </motion.div>

        {/* Details Area */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Metrics */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="glass p-6 rounded-2xl border border-white/10">
              <Target className="w-6 h-6 text-primary mb-3" />
              <div className="text-3xl font-display font-bold text-white mb-1">{result.accuracy}%</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Accuracy</div>
            </div>
            <div className="glass p-6 rounded-2xl border border-white/10">
              <Zap className="w-6 h-6 text-secondary mb-3" />
              <div className="text-3xl font-display font-bold text-white mb-1">{result.speedScore}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Speed Score</div>
            </div>
            <div className="glass p-6 rounded-2xl border border-white/10 col-span-2 flex justify-between items-center">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">Time Elapsed</div>
                <div className="text-xl font-mono text-white">{Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s</div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">Correct</div>
                <div className="text-xl font-mono text-white">{result.correctAnswers} / {result.totalQuestions}</div>
              </div>
            </div>
          </motion.div>

          {/* Breakdown */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="glass-panel p-6 rounded-2xl border border-white/10 flex-1 flex flex-col"
          >
            <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-4 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4" /> Profile Breakdown
            </h3>
            
            <div className="space-y-4 flex-1">
              <div>
                <div className="text-xs text-primary uppercase tracking-wider mb-2 font-bold">Primary Strengths</div>
                <div className="flex flex-wrap gap-2">
                  {result.strengths.map(s => (
                    <span key={s} className="px-3 py-1 rounded bg-primary/10 border border-primary/20 text-primary text-xs capitalize">{s}</span>
                  ))}
                  {result.strengths.length === 0 && <span className="text-xs text-muted-foreground">Insufficient data</span>}
                </div>
              </div>
              
              <div>
                <div className="text-xs text-destructive uppercase tracking-wider mb-2 font-bold">Areas for Growth</div>
                <div className="flex flex-wrap gap-2">
                  {result.weaknesses.map(w => (
                    <span key={w} className="px-3 py-1 rounded bg-destructive/10 border border-destructive/20 text-destructive text-xs capitalize">{w}</span>
                  ))}
                  {result.weaknesses.length === 0 && <span className="text-xs text-muted-foreground">None detected</span>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <Button variant="outline" className="w-full glass border-white/10 hover:bg-white/5">
                <Share2 className="w-4 h-4 mr-2" /> Share Profile
              </Button>
              <Link href="/dashboard">
                <Button className="w-full bg-white text-black hover:bg-white/90">
                  Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
