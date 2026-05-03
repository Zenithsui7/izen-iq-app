import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { BrainCircuit, Activity, Zap, Focus } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100dvh-4rem)]">
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-20 pb-32 relative">
        <div className="absolute inset-0 z-[-1] overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] animate-pulse-slow" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[80px]" />
          
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_10%,transparent_100%)]" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 relative"
        >
          <div className="w-24 h-24 rounded-2xl bg-black border border-white/10 flex items-center justify-center shadow-[0_0_50px_rgba(0,240,255,0.2)] glass">
            <BrainCircuit className="w-12 h-12 text-primary animate-pulse" />
          </div>
          <div className="absolute -inset-4 bg-primary/20 blur-xl rounded-full z-[-1]" />
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-5xl md:text-7xl font-display font-bold tracking-tight text-white mb-6 uppercase"
        >
          Intelligence <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Made Visible</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-sans"
        >
          Step into the ultimate cognitive observatory. Challenge your mind across multiple domains with precision instruments designed to map your intellectual profile.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <Link href="/leaderboard">
            <Button size="lg" variant="outline" className="h-14 px-8 border-white/10 text-white hover:bg-white/5 hover:text-white glass text-base font-medium">
              VIEW RANKINGS
            </Button>
          </Link>
        </motion.div>
      </section>

      <section className="py-24 border-t border-white/5 bg-black/50 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Activity className="w-6 h-6 text-primary" />}
              title="Precision Metrics"
              description="Measure processing speed, pattern recognition, and logical deduction with laboratory-grade accuracy."
            />
            <FeatureCard 
              icon={<Focus className="w-6 h-6 text-secondary" />}
              title="Deep Focus"
              description="A distraction-free environment that demands your absolute concentration. Anti-cheat mechanisms ensure pure results."
            />
            <FeatureCard 
              icon={<Zap className="w-6 h-6 text-accent" />}
              title="Cognitive Evolution"
              description="Track your performance over time. Identify structural strengths and target weak points."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="glass p-8 rounded-2xl border border-white/5 relative group overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-6 border border-white/10">
        {icon}
      </div>
      <h3 className="text-xl font-display font-semibold text-white mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}
