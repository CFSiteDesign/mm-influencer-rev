import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, Sparkles, Trophy } from "lucide-react";
import heartBadge from "@/assets/heart-badge.png";
import lightningBadge from "@/assets/lightning-badge.png";
import mmPatternBg from "@/assets/mm-pattern-bg.jpg";
import { Link } from "react-router-dom";
import AnimatedStatsGraphic from "@/components/AnimatedStatsGraphic";
import madMonkeyLogo from "@/assets/mad-monkey-logo.png";
import PoweredByTheoroX from "@/components/PoweredByTheoroX";

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
  const [creatorIdInput, setCreatorIdInput] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [revenue, setRevenue] = useState<RevenueRow[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [idMismatch, setIdMismatch] = useState(false);

  const handleSearch = async () => {
    if (!code.trim() || !creatorIdInput.trim()) return;
    setLoading(true);
    setNotFound(false);
    setIdMismatch(false);
    setSearched(false);

    const { data: creator } = await supabase
      .from("creators")
      .select("id, name, code, creator_id")
      .ilike("code", code.trim())
      .maybeSingle();

    if (!creator) { setNotFound(true); setLoading(false); return; }
    if (!creator.creator_id || creator.creator_id.toUpperCase() !== creatorIdInput.trim().toUpperCase()) {
      setIdMismatch(true); setLoading(false); return;
    }
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
  };

  const totalCommission = revenue.reduce((s, r) => s + (r.rooms_revenue + r.tours_revenue) * 0.1, 0);

  /* ─── LANDING STATE ─── */
  if (!searched) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex items-center justify-center px-5 py-10 md:py-0">
          <div className="w-full max-w-4xl flex flex-col md:flex-row items-center gap-8 md:gap-14">
            <div className="flex-1 text-center md:text-left">
              <img src={madMonkeyLogo} alt="Mad Monkey" className="h-10 md:h-12 mb-4 mx-auto md:mx-0" />
              <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display text-foreground tracking-tight">
                  Creator <span className="text-primary">Revenue</span>
                </h1>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2 mb-5">
                <img src={heartBadge} alt="" className="w-6 h-6" />
                <p className="text-muted-foreground text-sm md:text-base">
                  Check your commission earnings
                </p>
                <img src={lightningBadge} alt="" className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-2 max-w-md mx-auto md:mx-0">
                <input
                  value={creatorIdInput}
                  onChange={e => setCreatorIdInput(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                  placeholder="Creator ID (e.g. CH001)"
                  className="rounded-xl bg-card border border-border px-4 py-3 text-foreground text-base font-display placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
                <div className="flex gap-2">
                  <input
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === "Enter" && handleSearch()}
                    placeholder="Code (e.g. LEE10)"
                    className="flex-1 rounded-xl bg-card border border-border px-4 py-3 text-foreground text-base font-display placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={loading || !code.trim() || !creatorIdInput.trim()}
                    className="rounded-xl bg-primary text-primary-foreground px-5 py-3 font-display font-bold hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                    style={{ boxShadow: "0 4px 14px hsl(68 100% 45% / 0.25)" }}
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {notFound && <p className="mt-3 text-destructive text-sm font-medium">Code not found. Please check and try again.</p>}
              {idMismatch && <p className="mt-3 text-destructive text-sm font-medium">Creator ID doesn't match. Please check your credentials.</p>}
            </div>

            <div className="w-full max-w-xs md:max-w-sm flex-shrink-0">
              <div
                className="relative overflow-hidden rounded-3xl border border-primary/20 p-4 shadow-lg"
                style={{ backgroundImage: `url(${mmPatternBg})`, backgroundSize: "cover", backgroundPosition: "center", boxShadow: "0 18px 60px hsl(68 100% 45% / 0.1)" }}
              >
                <div className="absolute inset-0 bg-background/10 backdrop-blur-[1px]" />
                <div className="relative z-10">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-full bg-background/70 px-3 py-1 text-[10px] font-display font-bold uppercase tracking-widest text-foreground backdrop-blur-sm">Live stats</span>
                  </div>
                  <div className="rounded-2xl bg-background/70 p-2 backdrop-blur-sm">
                    <AnimatedStatsGraphic />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 pb-6">
          <Link
            to="/leaderboard"
            className="block max-w-4xl mx-auto rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 hover:border-primary/40 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-display font-bold text-foreground text-base">Creator Leaderboard</p>
                  <p className="text-muted-foreground text-xs">See who's earning the most — compete and climb the ranks</p>
                </div>
              </div>
              <span className="text-primary font-display font-bold text-sm group-hover:translate-x-1 transition-transform">View →</span>
            </div>
          </Link>
        </div>

        <PoweredByTheoroX />
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

          {/* Summary card */}
          <div className="mb-6">
            <div
              className="relative overflow-hidden rounded-xl p-4"
              style={{ backgroundImage: `url(${mmPatternBg})`, backgroundSize: "cover", backgroundPosition: "center" }}
            >
              <div className="absolute inset-0 bg-primary/25 backdrop-blur-sm" />
              <div className="relative z-10 text-center">
                <p className="text-xs font-medium mb-0.5 text-primary-foreground/80">Total Commission (10%)</p>
                <p className="text-3xl font-bold font-display text-primary-foreground">${totalCommission.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-border overflow-x-auto bg-card">
            <table className="w-full text-sm min-w-0">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left px-2 md:px-4 py-3 text-xs font-medium text-muted-foreground">Month</th>
                  <th className="text-right px-2 md:px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">Book.</th>
                  <th className="text-right px-2 md:px-4 py-3 text-xs font-medium text-muted-foreground">Beds</th>
                  <th className="text-right px-2 md:px-4 py-3 text-xs font-medium text-muted-foreground">Tours</th>
                  <th className="text-right px-2 md:px-4 py-3 text-xs font-medium text-muted-foreground">10%</th>
                </tr>
              </thead>
              <tbody>
                {revenue.map(row => {
                  const commission = (row.rooms_revenue + row.tours_revenue) * 0.1;
                  return (
                    <tr key={row.month} className="border-t border-border/50 hover:bg-muted/50 transition-colors">
                      <td className="px-2 md:px-4 py-2.5 text-foreground">
                        <span className="hidden md:inline">{row.month}</span>
                        <span className="md:hidden">{row.month.slice(0, 3)}</span>
                      </td>
                      <td className="px-2 md:px-4 py-2.5 text-right text-muted-foreground">{(row.rooms_bookings + row.tours_bookings) || "-"}</td>
                      <td className="px-2 md:px-4 py-2.5 text-right text-secondary font-medium">{row.rooms_revenue > 0 ? `$${row.rooms_revenue.toFixed(0)}` : "-"}</td>
                      <td className="px-2 md:px-4 py-2.5 text-right text-accent font-medium">{row.tours_revenue > 0 ? `$${row.tours_revenue.toFixed(0)}` : "-"}</td>
                      <td className="px-2 md:px-4 py-2.5 text-right text-primary font-bold">{commission > 0 ? `$${commission.toFixed(2)}` : "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="border-t border-border py-4 text-center flex flex-col items-center gap-2">
        <Link to="/leaderboard" className="inline-flex items-center gap-1.5 text-primary text-sm font-display font-bold hover:brightness-110 transition-all">
          <Trophy className="w-4 h-4" /> Leaderboard
        </Link>
        <PoweredByTheoroX />
      </div>
    </div>
  );
};

export default Index;
