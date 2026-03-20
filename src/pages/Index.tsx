import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, Sparkles } from "lucide-react";
import heartBadge from "@/assets/heart-badge.png";
import lightningBadge from "@/assets/lightning-badge.png";
import mmPatternBg from "@/assets/mm-pattern-bg.jpg";
import { Link } from "react-router-dom";
import AnimatedStatsGraphic from "@/components/AnimatedStatsGraphic";

interface RevenueRow {
  month: string;
  rooms_bookings: number;
  rooms_gna: number;
  rooms_revenue: number;
  tours_bookings: number;
  tours_revenue: number;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const Index = () => {
  const [code, setCode] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [revenue, setRevenue] = useState<RevenueRow[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<"rooms" | "tours">("rooms");

  const handleSearch = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setNotFound(false);
    setSearched(false);

    const { data: creator } = await supabase
      .from("creators")
      .select("id, name, code")
      .ilike("code", code.trim())
      .maybeSingle();

    if (!creator) { setNotFound(true); setLoading(false); return; }
    setCreatorName(creator.name || creator.code);

    const { data: revenueData } = await supabase
      .from("creator_monthly_revenue")
      .select("*")
      .eq("creator_id", creator.id);

    const monthMap: Record<string, RevenueRow> = {};
    MONTHS.forEach(m => { monthMap[m] = { month: m, rooms_bookings: 0, rooms_gna: 0, rooms_revenue: 0, tours_bookings: 0, tours_revenue: 0 }; });
    revenueData?.forEach((r: any) => {
      if (monthMap[r.month]) {
        monthMap[r.month] = { month: r.month, rooms_bookings: r.rooms_bookings, rooms_gna: r.rooms_gna, rooms_revenue: Number(r.rooms_revenue), tours_bookings: r.tours_bookings, tours_revenue: Number(r.tours_revenue) };
      }
    });

    setRevenue(MONTHS.map(m => monthMap[m]));
    setSearched(true);
    setLoading(false);
    setActiveTab("rooms");
  };

  const totalRoomsCommission = revenue.reduce((s, r) => s + r.rooms_revenue * 0.1, 0);
  const totalToursCommission = revenue.reduce((s, r) => s + r.tours_revenue * 0.1, 0);
  const totalCommission = totalRoomsCommission + totalToursCommission;

  /* ─── LANDING STATE ─── */
  if (!searched) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Main area: side-by-side on md+, stacked on mobile */}
        <div className="flex-1 flex items-center justify-center px-5 py-10 md:py-0">
          <div className="w-full max-w-4xl flex flex-col md:flex-row items-center gap-8 md:gap-14">
            {/* Left: text + search */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                <img src={heartBadge} alt="" className="w-9 h-9 md:w-11 md:h-11 animate-bounce" style={{ animationDuration: "3s" }} />
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display text-foreground tracking-tight">
                  Creator <span className="text-primary">Revenue</span>
                </h1>
                <img src={lightningBadge} alt="" className="w-9 h-9 md:w-11 md:h-11 animate-bounce" style={{ animationDuration: "2.5s", animationDelay: "0.5s" }} />
              </div>
              <p className="text-muted-foreground text-sm md:text-base mb-6 max-w-md mx-auto md:mx-0">
                Enter your unique creator code to check your commission earnings
              </p>
              <div className="flex gap-2 max-w-md mx-auto md:mx-0">
                <input
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                  placeholder="e.g. LEE10"
                  className="flex-1 rounded-xl bg-card border border-border px-4 py-3 text-foreground text-base font-display placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="rounded-xl bg-primary text-primary-foreground px-5 py-3 font-display font-bold hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                  style={{ boxShadow: "0 4px 14px hsl(68 100% 45% / 0.25)" }}
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
              {notFound && <p className="mt-3 text-destructive text-sm font-medium">Code not found. Please check and try again.</p>}
            </div>

            {/* Right: animated stats card */}
            <div className="w-full max-w-xs md:max-w-sm flex-shrink-0">
              <div
                className="relative overflow-hidden rounded-3xl border border-primary/20 p-4 shadow-lg"
                style={{ backgroundImage: `url(${mmPatternBg})`, backgroundSize: "cover", backgroundPosition: "center", boxShadow: "0 18px 60px hsl(68 100% 45% / 0.1)" }}
              >
                <div className="absolute inset-0 bg-background/10 backdrop-blur-[1px]" />
                <div className="relative z-10">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-full bg-background/70 px-3 py-1 text-[10px] font-display font-bold uppercase tracking-widest text-foreground backdrop-blur-sm">Live stats</span>
                    <span className="rounded-full bg-card/75 px-3 py-1 text-[10px] font-display font-bold text-secondary backdrop-blur-sm">10% only</span>
                  </div>
                  <div className="rounded-2xl bg-background/70 p-2 backdrop-blur-sm">
                    <AnimatedStatsGraphic />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border py-4 text-center">
          <Link to="/admin" className="text-muted-foreground text-xs hover:text-foreground transition-colors">Admin</Link>
        </div>
      </div>
    );
  }

  /* ─── RESULTS STATE ─── */
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Compact header */}
      <div className="bg-card/50 border-b border-border px-5 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={heartBadge} alt="" className="w-6 h-6" />
            <span className="text-lg font-bold font-display text-foreground">Creator <span className="text-primary">Revenue</span></span>
          </div>
          <div className="flex gap-2 flex-1 max-w-xs">
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="e.g. LEE10"
              className="flex-1 rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground font-display placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <button onClick={handleSearch} disabled={loading} className="rounded-lg bg-primary text-primary-foreground px-3 py-2 font-bold hover:brightness-110 active:scale-95 transition-all disabled:opacity-50">
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results content */}
      <div className="flex-1 px-5 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-xl md:text-2xl font-bold font-display text-foreground">
              {creatorName}'s <span className="text-primary">Earnings</span>
            </h2>
          </div>

          {/* Summary row: 3 cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            <div className="rounded-xl bg-card border border-border p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <img src={heartBadge} alt="" className="w-4 h-4" />
                <p className="text-muted-foreground text-xs font-medium">Rooms & Dorms</p>
              </div>
              <p className="text-2xl font-bold font-display text-secondary">${totalRoomsCommission.toFixed(2)}</p>
            </div>
            <div className="rounded-xl bg-card border border-border p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <img src={lightningBadge} alt="" className="w-4 h-4" />
                <p className="text-muted-foreground text-xs font-medium">Travel & Tours</p>
              </div>
              <p className="text-2xl font-bold font-display text-accent">${totalToursCommission.toFixed(2)}</p>
            </div>
            <div
              className="relative overflow-hidden rounded-xl p-4 col-span-2 md:col-span-1"
              style={{ backgroundImage: `url(${mmPatternBg})`, backgroundSize: "cover", backgroundPosition: "center" }}
            >
              <div className="absolute inset-0 bg-primary/25 backdrop-blur-sm" />
              <div className="relative z-10 text-center md:text-left">
                <p className="text-xs font-medium mb-0.5 text-primary-foreground/80">Total Commission</p>
                <p className="text-2xl md:text-3xl font-bold font-display text-primary-foreground">${totalCommission.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex rounded-xl bg-muted p-1 mb-4 max-w-xs">
            <button
              onClick={() => setActiveTab("rooms")}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-display font-bold transition-all ${activeTab === "rooms" ? "bg-card text-secondary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <img src={heartBadge} alt="" className="w-4 h-4" /> Rooms
            </button>
            <button
              onClick={() => setActiveTab("tours")}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-display font-bold transition-all ${activeTab === "tours" ? "bg-card text-accent shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <img src={lightningBadge} alt="" className="w-4 h-4" /> Tours
            </button>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-border overflow-hidden bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Month</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Bookings</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Your 10%</th>
                </tr>
              </thead>
              <tbody>
                {revenue.map(row => (
                  <tr key={row.month} className="border-t border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-2.5 text-foreground">{row.month}</td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground">
                      {activeTab === "rooms" ? (row.rooms_bookings || "-") : (row.tours_bookings || "-")}
                    </td>
                    <td className={`px-4 py-2.5 text-right font-medium ${activeTab === "rooms" ? "text-secondary" : "text-accent"}`}>
                      {activeTab === "rooms"
                        ? (row.rooms_revenue > 0 ? `$${(row.rooms_revenue * 0.1).toFixed(2)}` : "-")
                        : (row.tours_revenue > 0 ? `$${(row.tours_revenue * 0.1).toFixed(2)}` : "-")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="border-t border-border py-4 text-center">
        <Link to="/admin" className="text-muted-foreground text-xs hover:text-foreground transition-colors">Admin</Link>
      </div>
    </div>
  );
};

export default Index;
