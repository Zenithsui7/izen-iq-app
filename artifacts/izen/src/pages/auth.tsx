import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin, useRegister, useGuestLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { BrainCircuit, Loader2 } from "lucide-react";

export default function Auth() {
  const [, setLocation] = useLocation();
  const { setToken } = useAuth();
  const { toast } = useToast();
  
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const guestMutation = useGuestLogin();

  const handleAuthSuccess = (token: string) => {
    setToken(token);
    setLocation("/dashboard");
    toast({
      title: "Access Granted",
      description: "Welcome to the observatory.",
    });
  };

  const handleAuthError = (error: any) => {
    toast({
      title: "Access Denied",
      description: error?.message || "Authentication failed.",
      variant: "destructive",
    });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      loginMutation.mutate(
        { data: { email, password } },
        { onSuccess: (res) => handleAuthSuccess(res.token), onError: handleAuthError }
      );
    } else {
      registerMutation.mutate(
        { data: { email, password, name } },
        { onSuccess: (res) => handleAuthSuccess(res.token), onError: handleAuthError }
      );
    }
  };

  const handleGuest = () => {
    guestMutation.mutate(undefined, {
      onSuccess: (res) => handleAuthSuccess(res.token),
      onError: handleAuthError
    });
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending || guestMutation.isPending;

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="glass-panel p-8 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-xl bg-black border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.15)] mb-4">
              <BrainCircuit className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wider">
              {mode === "login" ? "Identity Verification" : "New Subject Registration"}
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Enter your credentials to access the lab.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs uppercase tracking-wider text-muted-foreground">Subject Name</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  className="bg-black/50 border-white/10 focus:border-primary/50 focus:ring-primary/20 h-12 transition-all"
                  placeholder="e.g. John Doe"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="bg-black/50 border-white/10 focus:border-primary/50 focus:ring-primary/20 h-12 transition-all font-mono text-sm"
                placeholder="subject@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">Security Key</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="bg-black/50 border-white/10 focus:border-primary/50 focus:ring-primary/20 h-12 transition-all font-mono"
                placeholder="••••••••"
              />
            </div>

            <Button 
              type="submit" 
              disabled={isLoading} 
              className="w-full h-12 mt-6 bg-white text-black hover:bg-white/90 font-bold tracking-wide"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (mode === "login" ? "AUTHENTICATE" : "REGISTER")}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-4 before:h-px before:flex-1 before:bg-white/5 after:h-px after:flex-1 after:bg-white/5">
            <span className="text-xs text-muted-foreground uppercase tracking-widest">OR</span>
          </div>

          <div className="space-y-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleGuest} 
              disabled={isLoading}
              className="w-full h-12 border-white/10 hover:bg-white/5 hover:text-white"
            >
              CONTINUE AS GUEST
            </Button>
            
            <div className="text-center">
              <button 
                type="button"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                {mode === "login" ? "Need an identity? Register here." : "Already registered? Authenticate."}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
