import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, Sparkles } from "lucide-react";
import heartBadge from "@/assets/heart-badge.png";
import lightningBadge from "@/assets/lightning-badge.png";
import yellowBg from "@/assets/yellow-bg.jpg";
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

    if (!creator) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setCreatorName(creator.name || creator.code);

    const { data: revenueData } = await supabase
      .from("creator_monthly_revenue")
      .select("*")
      .eq("creator_id", creator.id);

    const monthMap: Record<string, RevenueRow> = {};
    MONTHS.forEach(m => {
      monthMap[m] = { month: m, rooms_bookings: 0, rooms_gna: 0, rooms_revenue: 0, tours_bookings: 0, tours_revenue: 0 };
    });
    revenueData?.forEach((r: any) => {
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
    setSearched(true);
    setLoading(false);
    setActiveTab("rooms");
  };

  const totalRoomsCommission = revenue.reduce((s, r) => s + r.rooms_revenue * 0.1, 0);
  const totalToursCommission = revenue.reduce((s, r) => s + r.tours_revenue * 0.1, 0);
  const totalCommission = totalRoomsCommission + totalToursCommission;

  return (
    <div className="bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: `url(${yellowBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background" />

        <div className={`relative z-10 flex flex-col items-center justify-center px-5 text-center ${searched ? 'py-6' : 'pt-12 pb-4'}`}>
          <div className="flex items-center gap-3 mb-2">
            <img src={heartBadge} alt="" className={`${searched ? 'w-7 h-7' : 'w-9 h-9'} animate-bounce`} style={{ animationDuration: '3s' }} />
            <h1 className={`${searched ? 'text-xl' : 'text-2xl md:text-5xl'} font-bold font-display text-foreground tracking-tight`}>
              Creator <span className="text-primary">Revenue</span>
            </h1>
            <img src={lightningBadge} alt="" className={`${searched ? 'w-7 h-7' : 'w-9 h-9'} animate-bounce`} style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
          </div>

          {!searched && (
            <p className="text-muted-foreground text-sm mb-6 max-w-xs">
              Enter your creator code to check your commission
            </p>
          )}

          <div className={`flex w-full max-w-sm gap-2 ${searched ? 'mt-1' : ''}`}>
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
              className="rounded-xl bg-primary text-primary-foreground px-5 py-3 font-display font-bold hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 shadow-md"
              style={{ boxShadow: '0 4px 14px hsl(68 100% 45% / 0.3)' }}
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {notFound && (
            <p className="mt-3 text-destructive text-sm font-medium">Code not found. Please check and try again.</p>
          )}

          {/* Animated graphic when no results */}
          {!searched && <AnimatedStatsGraphic />}
        </div>
      </div>

      {/* Results */}
      {searched && (
        <div className="px-4 md:px-6 pb-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-lg font-bold font-display text-foreground">
              {creatorName}'s <span className="text-primary">Earnings</span>
            </h2>
          </div>

          {/* Total Commission Banner */}
          <div className="relative overflow-hidden rounded-2xl p-4 mb-4" style={{ backgroundImage: `url(${yellowBg})`, backgroundSize: 'cover' }}>
            <div className="absolute inset-0 bg-primary/30 backdrop-blur-sm" />
            <div className="relative z-10 text-center">
              <p className="text-xs font-medium mb-0.5 text-primary-foreground/80">Total Commission</p>
              <p className="text-3xl md:text-4xl font-bold font-display text-primary-foreground">${totalCommission.toFixed(2)}</p>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="rounded-xl bg-card border border-border p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <img src={heartBadge} alt="" className="w-4 h-4" />
                <p className="text-muted-foreground text-[10px] font-medium">Rooms & Dorms</p>
              </div>
              <p className="text-xl font-bold font-display text-secondary">${totalRoomsCommission.toFixed(2)}</p>
            </div>
            <div className="rounded-xl bg-card border border-border p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <img src={lightningBadge} alt="" className="w-4 h-4" />
                <p className="text-muted-foreground text-[10px] font-medium">Travel & Tours</p>
              </div>
              <p className="text-xl font-bold font-display text-accent">${totalToursCommission.toFixed(2)}</p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex rounded-xl bg-muted p-1 mb-4">
            <button
              onClick={() => setActiveTab("rooms")}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-display font-bold transition-all ${
                activeTab === "rooms"
                  ? "bg-card text-secondary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <img src={heartBadge} alt="" className="w-4 h-4" />
              Rooms
            </button>
            <button
              onClick={() => setActiveTab("tours")}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-display font-bold transition-all ${
                activeTab === "tours"
                  ? "bg-card text-accent shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <img src={lightningBadge} alt="" className="w-4 h-4" />
              Tours
            </button>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-border overflow-hidden bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground">Month</th>
                  <th className="text-right px-3 py-2.5 text-xs font-medium text-muted-foreground">Bookings</th>
                  <th className="text-right px-3 py-2.5 text-xs font-medium text-muted-foreground">Your 10%</th>
                </tr>
              </thead>
              <tbody>
                {revenue.map(r => (
                  <tr key={r.month} className="border-t border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="px-3 py-2 text-foreground text-sm">{r.month.slice(0, 3)}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">
                      {activeTab === "rooms" ? (r.rooms_bookings || '-') : (r.tours_bookings || '-')}
                    </td>
                    <td className={`px-3 py-2 text-right font-medium ${activeTab === "rooms" ? "text-secondary" : "text-accent"}`}>
                      {activeTab === "rooms"
                        ? (r.rooms_revenue > 0 ? `$${(r.rooms_revenue * 0.1).toFixed(2)}` : '-')
                        : (r.tours_revenue > 0 ? `$${(r.tours_revenue * 0.1).toFixed(2)}` : '-')
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-border py-4 text-center">
        <Link to="/admin" className="text-muted-foreground text-xs hover:text-foreground transition-colors">
          Admin
        </Link>
      </div>
    </div>
  );
};

export default Index;
