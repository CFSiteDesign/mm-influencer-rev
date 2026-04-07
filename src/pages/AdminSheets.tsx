import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Database, ChevronDown, ChevronRight, Users, DollarSign, BarChart3 } from "lucide-react";
import madMonkeyLogo from "@/assets/mad-monkey-logo.png";

interface RevenueRow {
  id: string;
  creator_code: string;
  month: string;
  rd_bookings: number | null;
  rd_gna: number | null;
  rd_room_revenue: number | null;
  hgl_bookings: number | null;
  hgl_revenue: number | null;
  synced_at: string | null;
}

interface CreatorSummary {
  code: string;
  totalRdBookings: number;
  totalRdRevenue: number;
  totalHglBookings: number;
  totalHglRevenue: number;
  months: RevenueRow[];
}

const MONTH_ORDER = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const AdminSheets = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<RevenueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate("/admin");
    });
  }, [navigate]);

  useEffect(() => {
    const load = async () => {
      const { data: rows } = await supabase
        .from("creator_revenue")
        .select("*")
        .order("creator_code")
        .order("month");
      setData(rows || []);
      setLoading(false);
    };
    load();
  }, []);

  const creators: CreatorSummary[] = [];
  const map = new Map<string, CreatorSummary>();

  data.forEach((r) => {
    if (!map.has(r.creator_code)) {
      const s: CreatorSummary = { code: r.creator_code, totalRdBookings: 0, totalRdRevenue: 0, totalHglBookings: 0, totalHglRevenue: 0, months: [] };
      map.set(r.creator_code, s);
      creators.push(s);
    }
    const s = map.get(r.creator_code)!;
    s.totalRdBookings += r.rd_bookings ?? 0;
    s.totalRdRevenue += r.rd_room_revenue ?? 0;
    s.totalHglBookings += r.hgl_bookings ?? 0;
    s.totalHglRevenue += r.hgl_revenue ?? 0;
    s.months.push(r);
  });

  // Sort months
  creators.forEach((c) => {
    c.months.sort((a, b) => MONTH_ORDER.indexOf(a.month) - MONTH_ORDER.indexOf(b.month));
  });

  const totalRd = creators.reduce((s, c) => s + c.totalRdRevenue, 0);
  const totalHgl = creators.reduce((s, c) => s + c.totalHglRevenue, 0);
  const lastSynced = data.reduce((max, r) => {
    const t = r.synced_at ? new Date(r.synced_at).getTime() : 0;
    return t > max ? t : max;
  }, 0);

  const toggle = (code: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  };

  const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-card/50 border-b border-border px-5 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/admin/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-display font-medium">Dashboard</span>
          </Link>
          <img src={madMonkeyLogo} alt="Mad Monkey" className="h-7" />
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 py-8">
        <div className="flex items-center gap-3 mb-2">
          <Database className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold font-display">Sheets Sync Data</h1>
        </div>
        {lastSynced > 0 && (
          <p className="text-muted-foreground text-xs mb-6">
            Last synced: {new Date(lastSynced).toLocaleString()}
          </p>
        )}

        {/* Stat bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard icon={<Users className="w-5 h-5" />} label="Total Creators" value={String(creators.length)} />
          <StatCard icon={<BarChart3 className="w-5 h-5" />} label="R&D Revenue" value={fmt(totalRd)} />
          <StatCard icon={<BarChart3 className="w-5 h-5" />} label="HGL Revenue" value={fmt(totalHgl)} />
          <StatCard icon={<DollarSign className="w-5 h-5" />} label="Combined" value={fmt(totalRd + totalHgl)} />
        </div>

        {loading ? (
          <p className="text-muted-foreground text-center py-16">Loading…</p>
        ) : creators.length === 0 ? (
          <p className="text-muted-foreground text-center py-16">No synced data yet. Push data from your Google Sheet webhook.</p>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[1fr_100px_120px_100px_120px_120px] bg-muted/50 text-xs font-display font-bold text-muted-foreground uppercase tracking-wider px-4 py-3">
              <span>Creator</span>
              <span className="text-right">R&D Bkgs</span>
              <span className="text-right">R&D Rev</span>
              <span className="text-right">HGL Bkgs</span>
              <span className="text-right">HGL Rev</span>
              <span className="text-right">Total</span>
            </div>

            {creators.map((c) => (
              <div key={c.code}>
                <button
                  onClick={() => toggle(c.code)}
                  className="w-full grid grid-cols-[1fr_auto] md:grid-cols-[1fr_100px_120px_100px_120px_120px] items-center px-4 py-3 hover:bg-card/80 transition-colors border-t border-border text-left"
                >
                  <span className="flex items-center gap-2 font-display font-bold text-sm">
                    {expanded.has(c.code) ? <ChevronDown className="w-4 h-4 text-primary" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    {c.code}
                  </span>
                  <span className="hidden md:block text-right text-sm tabular-nums">{c.totalRdBookings}</span>
                  <span className="hidden md:block text-right text-sm tabular-nums">{fmt(c.totalRdRevenue)}</span>
                  <span className="hidden md:block text-right text-sm tabular-nums">{c.totalHglBookings}</span>
                  <span className="hidden md:block text-right text-sm tabular-nums">{fmt(c.totalHglRevenue)}</span>
                  <span className="text-right text-sm font-bold text-primary tabular-nums">{fmt(c.totalRdRevenue + c.totalHglRevenue)}</span>
                </button>

                {expanded.has(c.code) && (
                  <div className="bg-muted/20 border-t border-border">
                    <div className="hidden md:grid grid-cols-[1fr_100px_80px_120px_100px_120px] text-[10px] text-muted-foreground uppercase tracking-wider px-4 py-2 pl-12 font-display font-bold">
                      <span>Month</span>
                      <span className="text-right">R&D Bkgs</span>
                      <span className="text-right">GNA</span>
                      <span className="text-right">R&D Rev</span>
                      <span className="text-right">HGL Bkgs</span>
                      <span className="text-right">HGL Rev</span>
                    </div>
                    {c.months.map((m) => (
                      <div key={m.id} className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_100px_80px_120px_100px_120px] px-4 py-2 pl-12 text-sm border-t border-border/50">
                        <span className="text-muted-foreground">{m.month}</span>
                        <span className="hidden md:block text-right tabular-nums">{m.rd_bookings ?? 0}</span>
                        <span className="hidden md:block text-right tabular-nums text-muted-foreground">{m.rd_gna ?? 0}</span>
                        <span className="hidden md:block text-right tabular-nums">{fmt(m.rd_room_revenue ?? 0)}</span>
                        <span className="hidden md:block text-right tabular-nums">{m.hgl_bookings ?? 0}</span>
                        <span className="text-right tabular-nums">{fmt(m.hgl_revenue ?? 0)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card border border-border p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">{icon}<span className="text-xs font-display font-medium">{label}</span></div>
      <p className="text-lg font-bold font-display text-foreground">{value}</p>
    </div>
  );
}

export default AdminSheets;
