import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, Sparkles } from "lucide-react";
import heartBadge from "@/assets/heart-badge.png";
import lightningBadge from "@/assets/lightning-badge.png";
import yellowBg from "@/assets/yellow-bg.jpg";
import { Link } from "react-router-dom";

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
  };

  const totalRoomsCommission = revenue.reduce((s, r) => s + r.rooms_revenue * 0.1, 0);
  const totalToursCommission = revenue.reduce((s, r) => s + r.tours_revenue * 0.1, 0);
  const totalCommission = totalRoomsCommission + totalToursCommission;

  return (
    <div className="bg-background flex flex-col min-h-screen">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-15"
          style={{ backgroundImage: `url(${yellowBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background" />

        <div className="relative z-10 flex flex-col items-center justify-center px-5 py-16 md:py-24 text-center">
          <div className="flex items-center gap-3 mb-4">
            <img src={heartBadge} alt="" className="w-10 h-10 md:w-14 md:h-14 animate-bounce" style={{ animationDuration: '3s' }} />
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold font-display text-foreground tracking-tight">
              Creator <span className="text-primary">Revenue</span>
            </h1>
            <img src={lightningBadge} alt="" className="w-10 h-10 md:w-14 md:h-14 animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
          </div>
          <p className="text-muted-foreground text-sm md:text-base mb-8 max-w-sm">
            Enter your unique creator code to check your commission earnings
          </p>

          <div className="flex w-full max-w-sm gap-2">
            <div className="flex-1 relative">
              <input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="e.g. LEE10"
                className="w-full rounded-xl bg-card/80 backdrop-blur border border-border px-4 py-3.5 text-foreground text-base font-display placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="rounded-xl bg-primary text-primary-foreground px-5 py-3.5 font-display font-bold hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {notFound && (
            <p className="mt-4 text-destructive text-sm font-medium">Code not found. Please check and try again.</p>
          )}
        </div>
      </div>

      {/* Results */}
      {searched && (
        <div className="px-4 md:px-6 pb-16 max-w-2xl mx-auto -mt-4">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-xl md:text-2xl font-bold font-display text-foreground">
              {creatorName}'s <span className="text-primary">Earnings</span>
            </h2>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="rounded-2xl bg-card border border-border p-4 md:p-5">
              <div className="flex items-center gap-2 mb-2">
                <img src={heartBadge} alt="" className="w-5 h-5" />
                <p className="text-muted-foreground text-xs font-medium">Rooms & Dorms</p>
              </div>
              <p className="text-2xl md:text-3xl font-bold font-display text-secondary">${totalRoomsCommission.toFixed(2)}</p>
            </div>
            <div className="rounded-2xl bg-card border border-border p-4 md:p-5">
              <div className="flex items-center gap-2 mb-2">
                <img src={lightningBadge} alt="" className="w-5 h-5" />
                <p className="text-muted-foreground text-xs font-medium">Travel & Tours</p>
              </div>
              <p className="text-2xl md:text-3xl font-bold font-display text-accent">${totalToursCommission.toFixed(2)}</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl p-5 mb-8" style={{ backgroundImage: `url(${yellowBg})`, backgroundSize: 'cover' }}>
            <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" />
            <div className="relative z-10 text-center">
              <p className="text-xs font-medium mb-1 text-primary-foreground/80">Total Commission</p>
              <p className="text-4xl md:text-5xl font-bold font-display text-primary-foreground">${totalCommission.toFixed(2)}</p>
            </div>
          </div>

          {/* Rooms & Dorms Table */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <img src={heartBadge} alt="" className="w-6 h-6" />
              <h3 className="text-base font-bold font-display text-foreground">Rooms & Dorms</h3>
            </div>
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground">Month</th>
                      <th className="text-right px-3 py-2.5 text-xs font-medium text-muted-foreground">Bookings</th>
                      <th className="text-right px-3 py-2.5 text-xs font-medium text-muted-foreground">Your 10%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenue.map(r => (
                      <tr key={r.month} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2.5 text-foreground text-sm">{r.month.slice(0, 3)}</td>
                        <td className="px-3 py-2.5 text-right text-muted-foreground">{r.rooms_bookings || '-'}</td>
                        <td className="px-3 py-2.5 text-right font-medium text-secondary">
                          {r.rooms_revenue > 0 ? `$${(r.rooms_revenue * 0.1).toFixed(2)}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Travel & Tours Table */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src={lightningBadge} alt="" className="w-6 h-6" />
              <h3 className="text-base font-bold font-display text-foreground">Travel & Tours</h3>
            </div>
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground">Month</th>
                      <th className="text-right px-3 py-2.5 text-xs font-medium text-muted-foreground">Bookings</th>
                      <th className="text-right px-3 py-2.5 text-xs font-medium text-muted-foreground">Your 10%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenue.map(r => (
                      <tr key={r.month} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2.5 text-foreground text-sm">{r.month.slice(0, 3)}</td>
                        <td className="px-3 py-2.5 text-right text-muted-foreground">{r.tours_bookings || '-'}</td>
                        <td className="px-3 py-2.5 text-right font-medium text-accent">
                          {r.tours_revenue > 0 ? `$${(r.tours_revenue * 0.1).toFixed(2)}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-border/50 py-5 text-center">
        <Link to="/admin" className="text-muted-foreground/50 text-xs hover:text-muted-foreground transition-colors">
          Admin
        </Link>
      </div>
    </div>
  );
};

export default Index;
