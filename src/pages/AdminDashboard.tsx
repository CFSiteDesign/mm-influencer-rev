import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { LogOut, Save, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";
import lightningBadge from "@/assets/lightning-badge.png";
import heartBadge from "@/assets/heart-badge.png";
import { toast } from "sonner";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

interface Creator {
  id: string;
  code: string;
  name: string | null;
}

interface RevenueEntry {
  month: string;
  rooms_bookings: number;
  rooms_gna: number;
  rooms_revenue: number;
  tours_bookings: number;
  tours_revenue: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [revenue, setRevenue] = useState<RevenueEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [expandedCreator, setExpandedCreator] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<"alpha" | "highest" | "lowest">("alpha");
  const [creatorTotals, setCreatorTotals] = useState<Record<string, number>>({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate("/admin");
      else setUser(data.user);
    });
  }, [navigate]);

  useEffect(() => {
    if (user) loadCreators();
  }, [user]);

  const loadCreators = async () => {
    const { data } = await supabase.from("creators").select("*").order("code");
    if (data) setCreators(data);

    // Load all revenue to compute totals per creator
    const { data: allRevenue } = await supabase.from("creator_monthly_revenue").select("creator_id, rooms_revenue, tours_revenue");
    const totals: Record<string, number> = {};
    allRevenue?.forEach((r: any) => {
      const cid = r.creator_id;
      totals[cid] = (totals[cid] || 0) + Number(r.rooms_revenue) * 0.1 + Number(r.tours_revenue) * 0.1;
    });
    setCreatorTotals(totals);
  };

  const selectCreator = async (creator: Creator) => {
    setSelectedCreator(creator);
    setExpandedCreator(creator.id);
    const { data } = await supabase
      .from("creator_monthly_revenue")
      .select("*")
      .eq("creator_id", creator.id);

    const monthMap: Record<string, RevenueEntry> = {};
    MONTHS.forEach(m => {
      monthMap[m] = { month: m, rooms_bookings: 0, rooms_gna: 0, rooms_revenue: 0, tours_bookings: 0, tours_revenue: 0 };
    });
    data?.forEach((r: any) => {
      if (monthMap[r.month]) {
        monthMap[r.month] = {
          month: r.month,
          rooms_bookings: r.rooms_bookings,
          rooms_gna: r.rooms_gna,
          rooms_revenue: Number(r.rooms_revenue),
          tours_bookings: r.tours_bookings,
          tours_revenue: Number(r.tours_revenue),
        };
      }
    });
    setRevenue(MONTHS.map(m => monthMap[m]));
  };

  const updateRevenue = (month: string, field: keyof RevenueEntry, value: string) => {
    setRevenue(prev => prev.map(r =>
      r.month === month ? { ...r, [field]: field === "month" ? value : Number(value) || 0 } : r
    ));
  };

  const saveRevenue = async () => {
    if (!selectedCreator) return;
    setSaving(true);

    for (const r of revenue) {
      const { data: existing } = await supabase
        .from("creator_monthly_revenue")
        .select("id")
        .eq("creator_id", selectedCreator.id)
        .eq("month", r.month)
        .maybeSingle();

      if (existing) {
        await supabase.from("creator_monthly_revenue").update({
          rooms_bookings: r.rooms_bookings,
          rooms_gna: r.rooms_gna,
          rooms_revenue: r.rooms_revenue,
          tours_bookings: r.tours_bookings,
          tours_revenue: r.tours_revenue,
        }).eq("id", existing.id);
      } else {
        const hasData = r.rooms_bookings || r.rooms_revenue || r.tours_bookings || r.tours_revenue;
        if (hasData) {
          await supabase.from("creator_monthly_revenue").insert({
            creator_id: selectedCreator.id,
            month: r.month,
            rooms_bookings: r.rooms_bookings,
            rooms_gna: r.rooms_gna,
            rooms_revenue: r.rooms_revenue,
            tours_bookings: r.tours_bookings,
            tours_revenue: r.tours_revenue,
          });
        }
      }
    }

    setSaving(false);
    toast.success("Revenue data saved!");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  const filteredCreators = creators
    .filter(c =>
      c.code.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (c.name && c.name.toLowerCase().includes(searchFilter.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortMode === "alpha") return a.code.localeCompare(b.code);
      const totalA = creatorTotals[a.id] || 0;
      const totalB = creatorTotals[b.id] || 0;
      return sortMode === "highest" ? totalB - totalA : totalA - totalB;
    });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={lightningBadge} alt="" className="w-8 h-8" />
          <h1 className="text-xl font-bold font-display text-foreground">Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/" className="text-muted-foreground text-sm hover:text-primary transition-colors">
            View Public Page
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-65px)]">
        {/* Sidebar - Creator List */}
        <div className="w-72 border-r border-border overflow-y-auto p-4">
          <input
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            placeholder="Filter creators..."
            className="w-full rounded-lg bg-card border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-2"
          />
          <div className="flex items-center gap-1 mb-3">
            <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
            {(["alpha", "highest", "lowest"] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setSortMode(mode)}
                className={`px-2 py-1 rounded-md text-[11px] font-display font-medium transition-colors ${
                  sortMode === mode
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {mode === "alpha" ? "A–Z" : mode === "highest" ? "Top $" : "Low $"}
              </button>
            ))}
          </div>
          {filteredCreators.map(c => (
            <button
              key={c.id}
              onClick={() => selectCreator(c)}
              className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors text-sm ${
                selectedCreator?.id === c.id
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <span className="font-display font-medium">{c.code}</span>
              {c.name && <span className="text-xs ml-2 opacity-70">{c.name}</span>}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedCreator ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <img src={heartBadge} alt="" className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg">Select a creator to edit their revenue data</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold font-display text-foreground">
                  {selectedCreator.code} <span className="text-muted-foreground font-normal text-lg">({selectedCreator.name})</span>
                </h2>
                <button
                  onClick={saveRevenue}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 font-display font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save All"}
                </button>
              </div>

              {/* Rooms & Dorms */}
              <div className="mb-8">
                <h3 className="text-lg font-bold font-display text-secondary mb-3 flex items-center gap-2">
                  <img src={heartBadge} alt="" className="w-6 h-6" /> Rooms & Dorms
                </h3>
                <div className="rounded-2xl border border-border overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted">
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Month</th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground"># Bookings</th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">GNA</th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Room Revenue ($)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenue.map(r => (
                        <tr key={r.month} className="border-t border-border">
                          <td className="px-4 py-2 text-foreground text-sm">{r.month}</td>
                          <td className="px-4 py-2 text-right">
                            <input type="number" value={r.rooms_bookings || ""} onChange={e => updateRevenue(r.month, "rooms_bookings", e.target.value)} className="w-20 bg-card border border-border rounded px-2 py-1 text-right text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                          </td>
                          <td className="px-4 py-2 text-right">
                            <input type="number" value={r.rooms_gna || ""} onChange={e => updateRevenue(r.month, "rooms_gna", e.target.value)} className="w-20 bg-card border border-border rounded px-2 py-1 text-right text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                          </td>
                          <td className="px-4 py-2 text-right">
                            <input type="number" step="0.01" value={r.rooms_revenue || ""} onChange={e => updateRevenue(r.month, "rooms_revenue", e.target.value)} className="w-28 bg-card border border-border rounded px-2 py-1 text-right text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Travel & Tours */}
              <div>
                <h3 className="text-lg font-bold font-display text-accent mb-3 flex items-center gap-2">
                  <img src={lightningBadge} alt="" className="w-6 h-6" /> Travel & Tours (HGL)
                </h3>
                <div className="rounded-2xl border border-border overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted">
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Month</th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground"># Bookings</th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">HGL Revenue ($)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenue.map(r => (
                        <tr key={r.month} className="border-t border-border">
                          <td className="px-4 py-2 text-foreground text-sm">{r.month}</td>
                          <td className="px-4 py-2 text-right">
                            <input type="number" value={r.tours_bookings || ""} onChange={e => updateRevenue(r.month, "tours_bookings", e.target.value)} className="w-20 bg-card border border-border rounded px-2 py-1 text-right text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                          </td>
                          <td className="px-4 py-2 text-right">
                            <input type="number" step="0.01" value={r.tours_revenue || ""} onChange={e => updateRevenue(r.month, "tours_revenue", e.target.value)} className="w-28 bg-card border border-border rounded px-2 py-1 text-right text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
