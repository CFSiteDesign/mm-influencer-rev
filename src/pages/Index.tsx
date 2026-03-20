import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";
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
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url(${yellowBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="relative z-10 flex flex-col items-center justify-center px-4 py-20 text-center">
          <div className="flex items-center gap-4 mb-6">
            <img src={heartBadge} alt="" className="w-14 h-14 animate-bounce" style={{ animationDuration: '3s' }} />
            <h1 className="text-4xl md:text-6xl font-bold font-display text-foreground">
              Creator <span className="text-primary">Revenue</span>
            </h1>
            <img src={lightningBadge} alt="" className="w-14 h-14 animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
          </div>
          <p className="text-muted-foreground text-lg mb-10 max-w-md">
            Enter your unique creator code to check your commission earnings.
          </p>

          <div className="flex w-full max-w-md gap-3">
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Enter your code e.g. LEE10"
              className="flex-1 rounded-xl bg-card border border-border px-5 py-4 text-foreground text-lg font-display placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="rounded-xl bg-primary text-primary-foreground px-6 py-4 font-display font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Search className="w-6 h-6" />
            </button>
          </div>

          {notFound && (
            <p className="mt-4 text-destructive font-medium">Code not found. Please check and try again.</p>
          )}
        </div>
      </div>

      {/* Results */}
      {searched && (
        <div className="px-4 pb-20 max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <img src={lightningBadge} alt="" className="w-10 h-10" />
            <h2 className="text-3xl font-bold font-display text-foreground">
              {creatorName}'s <span className="text-primary">Earnings</span>
            </h2>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <div className="rounded-2xl bg-card border border-border p-6">
              <p className="text-muted-foreground text-sm font-medium mb-1">Rooms & Dorms Commission</p>
              <p className="text-3xl font-bold font-display text-secondary">${totalRoomsCommission.toFixed(2)}</p>
            </div>
            <div className="rounded-2xl bg-card border border-border p-6">
              <p className="text-muted-foreground text-sm font-medium mb-1">Travel & Tours Commission</p>
              <p className="text-3xl font-bold font-display text-accent">${totalToursCommission.toFixed(2)}</p>
            </div>
            <div className="relative overflow-hidden rounded-2xl p-6" style={{ backgroundImage: `url(${yellowBg})`, backgroundSize: 'cover' }}>
              <div className="relative z-10">
                <p className="text-sm font-medium mb-1" style={{ color: 'hsl(0 0% 7%)' }}>Total Commission</p>
                <p className="text-4xl font-bold font-display" style={{ color: 'hsl(0 0% 7%)' }}>${totalCommission.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Rooms & Dorms Table */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <img src={heartBadge} alt="" className="w-8 h-8" />
              <h3 className="text-xl font-bold font-display text-foreground">Rooms & Dorms</h3>
            </div>
            <div className="rounded-2xl border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Month</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground"># Bookings</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Your 10%</th>
                  </tr>
                </thead>
                <tbody>
                  {revenue.map(r => (
                    <tr key={r.month} className="border-t border-border hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-foreground">{r.month}</td>
                      <td className="px-4 py-3 text-right text-foreground">{r.rooms_bookings || '-'}</td>
                      <td className="px-4 py-3 text-right font-medium text-secondary">
                        {r.rooms_revenue > 0 ? `$${(r.rooms_revenue * 0.1).toFixed(2)}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Travel & Tours Table */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={lightningBadge} alt="" className="w-8 h-8" />
              <h3 className="text-xl font-bold font-display text-foreground">Travel & Tours (HGL)</h3>
            </div>
            <div className="rounded-2xl border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Month</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground"># Bookings</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Your 10%</th>
                  </tr>
                </thead>
                <tbody>
                  {revenue.map(r => (
                    <tr key={r.month} className="border-t border-border hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-foreground">{r.month}</td>
                      <td className="px-4 py-3 text-right text-foreground">{r.tours_bookings || '-'}</td>
                      <td className="px-4 py-3 text-right font-medium text-accent">
                        {r.tours_revenue > 0 ? `$${(r.tours_revenue * 0.1).toFixed(2)}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-border py-6 text-center">
        <Link to="/admin" className="text-muted-foreground text-sm hover:text-primary transition-colors">
          Admin Login
        </Link>
      </div>
    </div>
  );
};

export default Index;
