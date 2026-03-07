import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isForgot) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast({ title: "Check your email", description: "Password reset link has been sent." });
        setIsForgot(false);
      } else if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({ title: "Check your email", description: "Please verify your email to complete signup." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="font-mono text-[10px] tracking-[4px] text-sidebar-primary uppercase mb-3">
            Multi-Institutional Intelligence Engine
          </p>
          <h1 className="font-display text-4xl font-black text-sidebar-foreground tracking-tight">
            MII Engine
          </h1>
          <p className="text-[13px] text-sidebar-foreground/40 mt-2">
            {isForgot ? "Reset your password" : isSignUp ? "Create your account" : "Sign in to save your analysis"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="font-mono text-[9px] tracking-[2px] uppercase text-sidebar-foreground/50 block mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required={isSignUp}
                className="w-full bg-sidebar-accent text-sidebar-foreground font-mono text-[13px] px-4 py-3 border border-sidebar-border focus:border-sidebar-primary focus:outline-none"
                placeholder="Your name"
              />
            </div>
          )}

          <div>
            <label className="font-mono text-[9px] tracking-[2px] uppercase text-sidebar-foreground/50 block mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-sidebar-accent text-sidebar-foreground font-mono text-[13px] px-4 py-3 border border-sidebar-border focus:border-sidebar-primary focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          {!isForgot && (
            <div>
              <label className="font-mono text-[9px] tracking-[2px] uppercase text-sidebar-foreground/50 block mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-sidebar-accent text-sidebar-foreground font-mono text-[13px] px-4 py-3 border border-sidebar-border focus:border-sidebar-primary focus:outline-none"
                placeholder="••••••••"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sidebar-primary text-sidebar-primary-foreground font-mono text-[11px] tracking-[2px] uppercase py-3 hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {loading ? "Processing..." : isForgot ? "Send Reset Link" : isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>

        {/* Toggle links */}
        <div className="mt-6 text-center space-y-2">
          {!isForgot && (
            <button
              onClick={() => setIsForgot(true)}
              className="font-mono text-[11px] text-sidebar-foreground/40 hover:text-sidebar-primary transition-colors"
            >
              Forgot password?
            </button>
          )}
          <div>
            <button
              onClick={() => { setIsSignUp(!isSignUp); setIsForgot(false); }}
              className="font-mono text-[11px] text-sidebar-primary hover:underline"
            >
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </button>
          </div>
          <div>
            <button
              onClick={() => navigate("/")}
              className="font-mono text-[11px] text-sidebar-foreground/30 hover:text-sidebar-foreground/60 transition-colors"
            >
              ← Continue without account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
