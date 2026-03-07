import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("type=recovery")) {
      toast({ title: "Invalid link", description: "This reset link is invalid or expired.", variant: "destructive" });
    }
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Password updated", description: "You can now sign in with your new password." });
      navigate("/");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl font-black text-sidebar-foreground">Set New Password</h1>
        </div>
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="font-mono text-[9px] tracking-[2px] uppercase text-sidebar-foreground/50 block mb-1.5">New Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
              className="w-full bg-sidebar-accent text-sidebar-foreground font-mono text-[13px] px-4 py-3 border border-sidebar-border focus:border-sidebar-primary focus:outline-none"
              placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-sidebar-primary text-sidebar-primary-foreground font-mono text-[11px] tracking-[2px] uppercase py-3 hover:opacity-90 disabled:opacity-40">
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
