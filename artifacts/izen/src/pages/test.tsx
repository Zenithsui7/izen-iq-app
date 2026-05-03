import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useStartTest, useSubmitTest } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, Clock, AlertTriangle, Loader2, Zap, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { StartTestBodyCategory, StartTestBodyDifficulty } from "@workspace/api-client-react";

type TestPhase = "config" | "running" | "submitting";
type TestMode = "iq" | "custom";

export default function TestSession() {
  const [, setLocation] = useLocation();
  const [phase, setPhase] = useState<TestPhase>("config");
  const [testMode, setTestMode] = useState<TestMode>("iq");

  // Config state
  const [category, setCategory] = useState<StartTestBodyCategory>("mixed");
  const [difficulty, setDifficulty] = useState<StartTestBodyDifficulty>("adaptive");

  // Session state
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);

  const startMutation = useStartTest();
  const submitMutation = useSubmitTest();

  // Tab switch detection
  useEffect(() => {
    if (phase !== "running") return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        toast.error("Focus Lost", {
          description: "Warning: Leaving the test tab may invalidate your results.",
          icon: <AlertTriangle className="w-5 h-5 text-destructive" />,
          duration: 5000,
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [phase]);

  // Timer logic
  useEffect(() => {
    if (phase !== "running" || !questions[currentIdx]) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, currentIdx, questions]);

  const handleStart = () => {
    const finalCategory = testMode === "iq" ? "mixed" as StartTestBodyCategory : category;
    const finalDifficulty = testMode === "iq" ? "adaptive" as StartTestBodyDifficulty : difficulty;
    startMutation.mutate(
      { data: { category: finalCategory, difficulty: finalDifficulty, questionCount: 10 } },
      {
        onSuccess: (data) => {
          setSessionId(data.id);
          setQuestions(data.questions);
          setCurrentIdx(0);
          setPhase("running");
          setTimeLeft(data.questions[0].timeLimit);
          setStartTime(Date.now());
        }
      }
    );
  };

  const handleAnswer = (optionIdx: number) => {
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const newAnswer = {
      questionId: questions[currentIdx].id,
      selectedOption: optionIdx,
      timeTaken: Math.min(timeTaken, questions[currentIdx].timeLimit)
    };
    
    const newAnswers = [...answers, newAnswer];
    setAnswers(newAnswers);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setTimeLeft(questions[currentIdx + 1].timeLimit);
      setStartTime(Date.now());
    } else {
      submitTest(newAnswers);
    }
  };

  const handleTimeUp = () => {
    handleAnswer(-1); // -1 for unanswered
  };

  const submitTest = (finalAnswers: any[]) => {
    if (!sessionId) return;
    setPhase("submitting");
    
    const totalTime = finalAnswers.reduce((acc, a) => acc + a.timeTaken, 0);

    submitMutation.mutate(
      { testId: sessionId, data: { answers: finalAnswers, timeTaken: totalTime } },
      {
        onSuccess: (data) => {
          setLocation(`/results/${data.id}`);
        },
        onError: () => {
          toast.error("Failed to submit test. Please try again.");
          setPhase("running"); // Allow retry
        }
      }
    );
  };

  if (phase === "config") {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full space-y-4"
        >
          <div className="text-center mb-6">
            <BrainCircuit className="w-10 h-10 text-primary mx-auto mb-3" />
            <h1 className="text-3xl font-display font-bold text-white uppercase tracking-wider">Select Test Mode</h1>
            <p className="text-muted-foreground mt-1 text-sm">Choose how you want to be tested.</p>
          </div>

          {/* Mode selector cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setTestMode("iq")}
              className={`relative group p-6 rounded-2xl border text-left transition-all ${
                testMode === "iq"
                  ? "bg-primary/10 border-primary glow-blue"
                  : "glass border-white/10 hover:border-white/30 hover:bg-white/5"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 border ${testMode === "iq" ? "bg-primary/20 border-primary/40" : "bg-white/5 border-white/10"}`}>
                <Zap className={`w-5 h-5 ${testMode === "iq" ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div className="font-display font-bold text-white uppercase tracking-wider text-lg mb-1">IQ Test</div>
              <div className="text-xs text-muted-foreground leading-relaxed">
                Full-spectrum cognitive assessment across all domains. Adaptive difficulty. Measures your true IQ score.
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 border border-primary/20 text-primary">All Domains</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 border border-primary/20 text-primary">Adaptive</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 border border-primary/20 text-primary">10 Questions</span>
              </div>
              {testMode === "iq" && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <svg viewBox="0 0 10 10" className="w-3 h-3 fill-black"><path d="M1.5 5L4 7.5L8.5 3" stroke="black" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
                </div>
              )}
            </button>

            <button
              onClick={() => setTestMode("custom")}
              className={`relative group p-6 rounded-2xl border text-left transition-all ${
                testMode === "custom"
                  ? "bg-secondary/10 border-secondary glow-violet"
                  : "glass border-white/10 hover:border-white/30 hover:bg-white/5"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 border ${testMode === "custom" ? "bg-secondary/20 border-secondary/40" : "bg-white/5 border-white/10"}`}>
                <SlidersHorizontal className={`w-5 h-5 ${testMode === "custom" ? "text-secondary" : "text-muted-foreground"}`} />
              </div>
              <div className="font-display font-bold text-white uppercase tracking-wider text-lg mb-1">Custom Test</div>
              <div className="text-xs text-muted-foreground leading-relaxed">
                Choose your domain and intensity level. Target specific cognitive skills on your own terms.
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-secondary/10 border border-secondary/20 text-secondary">Pick Domain</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-secondary/10 border border-secondary/20 text-secondary">Set Intensity</span>
              </div>
              {testMode === "custom" && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-secondary flex items-center justify-center">
                  <svg viewBox="0 0 10 10" className="w-3 h-3 fill-black"><path d="M1.5 5L4 7.5L8.5 3" stroke="black" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
                </div>
              )}
            </button>
          </div>

          {/* Custom options — shown only when custom mode is selected */}
          <AnimatePresence>
            {testMode === "custom" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-white/50 mb-3 block">Domain</label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {Object.values(StartTestBodyCategory).map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setCategory(cat)}
                          className={`p-2.5 rounded-xl border transition-all uppercase text-xs font-bold tracking-wider ${
                            category === cat
                              ? "bg-secondary/20 border-secondary text-white"
                              : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-white/50 mb-3 block">Intensity</label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {Object.values(StartTestBodyDifficulty).map((diff) => (
                        <button
                          key={diff}
                          onClick={() => setDifficulty(diff)}
                          className={`p-2.5 rounded-xl border transition-all uppercase text-xs font-bold tracking-wider ${
                            difficulty === diff
                              ? "bg-secondary/20 border-secondary text-white"
                              : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            onClick={handleStart}
            disabled={startMutation.isPending}
            className="w-full h-14 bg-white text-black hover:bg-white/90 text-lg font-bold tracking-wide"
          >
            {startMutation.isPending
              ? <Loader2 className="w-6 h-6 animate-spin" />
              : testMode === "iq" ? "BEGIN IQ TEST" : "INITIALIZE TEST SEQUENCE"
            }
          </Button>
        </motion.div>
      </div>
    );
  }

  if (phase === "submitting") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
        <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wider animate-pulse">Analyzing Results...</h2>
        <p className="text-muted-foreground mt-2 font-mono text-sm">Processing cognitive metrics</p>
      </div>
    );
  }

  const question = questions[currentIdx];
  const progress = ((currentIdx) / questions.length) * 100;

  return (
    <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto p-4 md:p-8">
      {/* Header / Progress */}
      <div className="flex items-center justify-between mb-8 glass px-6 py-4 rounded-xl border border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-primary/30 flex items-center justify-center">
            <span className="font-mono text-primary font-bold">{currentIdx + 1}/{questions.length}</span>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Category</div>
            <div className="text-white capitalize">{question.category}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-secondary font-mono text-xl font-bold bg-secondary/10 px-4 py-2 rounded-lg border border-secondary/30 glow-violet">
          <Clock className="w-5 h-5" />
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
      </div>

      <div className="w-full h-1 bg-white/5 rounded-full mb-8 overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-primary to-secondary"
          initial={{ width: `${((currentIdx) / questions.length) * 100}%` }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="flex-1 flex flex-col"
        >
          <div className="glass-panel p-8 md:p-12 rounded-2xl border border-white/10 mb-8 min-h-[200px] flex items-center justify-center relative overflow-hidden">
            {/* Subtle background element based on category */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
              {question.category === 'pattern' && <BrainCircuit className="w-64 h-64" />}
            </div>
            
            <h2 className="text-2xl md:text-4xl font-serif text-white text-center leading-relaxed relative z-10">
              {question.text}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-auto">
            {question.options.map((opt: string, idx: number) => (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                className="group relative overflow-hidden glass p-6 rounded-xl border border-white/10 hover:border-primary/50 text-left transition-all hover:-translate-y-1 hover:shadow-[0_10px_20px_-10px_rgba(0,240,255,0.2)]"
              >
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-8 h-8 rounded-md bg-white/5 border border-white/10 flex items-center justify-center shrink-0 font-mono text-sm text-muted-foreground group-hover:text-primary transition-colors">
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="text-lg text-white font-medium group-hover:text-glow transition-all">{opt}</span>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
