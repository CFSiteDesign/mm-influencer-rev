import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import lightningBadge from "@/assets/lightning-badge.png";
import yellowBg from "@/assets/yellow-bg.jpg";
import { toast } from "sonner";

const ADMIN_EMAIL = "mm-rev-admin@madmonkey.internal";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (username.trim() !== "admin") {
      toast.error("Invalid username");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password,
    });

    if (error) {
      toast.error("Invalid credentials");
    } else {
      navigate("/admin/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url(${yellowBg})`, backgroundSize: 'cover' }} />

      <div className="relative z-10 w-full max-w-sm px-4">
        <div className="flex flex-col items-center mb-8">
          <img src={lightningBadge} alt="" className="w-16 h-16 mb-4" />
          <h1 className="text-3xl font-bold font-display text-foreground">Admin Login</h1>
          <p className="text-muted-foreground text-sm mt-2">Mad Monkey Revenue Team</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-card border border-border p-6 space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              className="w-full rounded-lg bg-background border border-border px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full rounded-lg bg-background border border-border px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary text-primary-foreground py-3 font-display font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Loading..." : "Login"}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link to="/" className="text-muted-foreground text-sm hover:text-primary transition-colors">
            ← Back to Public Page
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
