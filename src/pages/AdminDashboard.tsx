import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { LogOut, Save, ChevronDown, ChevronUp, ArrowUpDown, Trash2, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import lightningBadge from "@/assets/lightning-badge.png";
import heartBadge from "@/assets/heart-badge.png";
import { toast } from "sonner";
import madMonkeyLogo from "@/assets/mad-monkey-logo.png";
import PoweredByTheoroX from "@/components/PoweredByTheoroX";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function MonthComparison({
  rows,
  creators,
  compareFrom,
  compareTo,
  setCompareFrom,
  setCompareTo,
}: {
  rows: any[];
  creators: { id: string; code: string; name: string | null }[];
  compareFrom: string;
  compareTo: string;
  setCompareFrom: (v: string) => void;
  setCompareTo: (v: string) => void;
}) {
  const [sortBy, setSortBy] = useState<
    "deltaDesc" | "pctDesc" | "toDesc" | "fromDesc" | "alpha" | "alphaDesc"
  >("deltaDesc");

  const totalsByCodeMonth: Record<string, Record<string, number>> = {};
  rows.forEach((r) => {
    const code = (r.creator_code || "").toUpperCase();
    const total =
      Number(r.rd_room_revenue || 0) +
      Number(r.hgl_revenue || 0) +
      Number(r.events_revenue || 0);
    if (!totalsByCodeMonth[code]) totalsByCodeMonth[code] = {};
    totalsByCodeMonth[code][r.month] =
      (totalsByCodeMonth[code][r.month] || 0) + total;
  });

  const knownCodes = new Set(creators.map((c) => c.code.toUpperCase()));
  const nameByCode: Record<string, string | null> = {};
  creators.forEach((c) => (nameByCode[c.code.toUpperCase()] = c.name));

  const allCodes = Array.from(
    new Set([...Object.keys(totalsByCodeMonth), ...knownCodes])
  );

  const sortOptions: { value: typeof sortBy; label: string }[] = [
    { value: "deltaDesc", label: "Biggest Δ $" },
    { value: "pctDesc", label: "Biggest Δ %" },
    { value: "toDesc", label: `Highest ${compareTo}` },
    { value: "fromDesc", label: `Highest ${compareFrom}` },
    { value: "alpha", label: "A – Z" },
    { value: "alphaDesc", label: "Z – A" },
  ];

  const items = allCodes
    .map((code) => {
      const from = totalsByCodeMonth[code]?.[compareFrom] || 0;
      const to = totalsByCodeMonth[code]?.[compareTo] || 0;
      return {
        code,
        name: nameByCode[code] || null,
        from,
        to,
        delta: to - from,
        pct: from > 0 ? ((to - from) / from) * 100 : null,
      };
    })
    .filter((i) => i.from > 0 || i.to > 0)
    .sort((a, b) => {
      switch (sortBy) {
        case "deltaDesc":
          return b.delta - a.delta;
        case "pctDesc":
          return (b.pct ?? -Infinity) - (a.pct ?? -Infinity);
        case "toDesc":
          return b.to - a.to;
        case "fromDesc":
          return b.from - a.from;
        case "alpha":
          return a.code.localeCompare(b.code);
        case "alphaDesc":
          return b.code.localeCompare(a.code);
        default:
          return 0;
      }
    });

  const fromTotal = items.reduce((s, i) => s + i.from, 0);
  const toTotal = items.reduce((s, i) => s + i.to, 0);
  const gainers = items.filter((i) => i.delta > 0).length;
  const decliners = items.filter((i) => i.delta < 0).length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-display text-foreground">
            Month-over-Month Comparison
          </h2>
          <p className="text-sm text-muted-foreground">
            Gross revenue (Rooms + Tours + Events) per creator
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={compareFrom}
            onChange={(e) => setCompareFrom(e.target.value)}
            className="rounded-lg bg-card border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {MONTHS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <span className="text-muted-foreground text-sm">vs</span>
          <select
            value={compareTo}
            onChange={(e) => setCompareTo(e.target.value)}
            className="rounded-lg bg-card border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {MONTHS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-display">{compareFrom} total</div>
          <div className="text-lg font-bold font-display text-foreground">${fromTotal.toLocaleString(undefined,{maximumFractionDigits:2})}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-display">{compareTo} total</div>
          <div className="text-lg font-bold font-display text-foreground">${toTotal.toLocaleString(undefined,{maximumFractionDigits:2})}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-display">Gainers</div>
          <div className="text-lg font-bold font-display text-secondary flex items-center gap-1"><TrendingUp className="w-4 h-4" />{gainers}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-display">Decliners</div>
          <div className="text-lg font-bold font-display text-destructive flex items-center gap-1"><TrendingDown className="w-4 h-4" />{decliners}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-border overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="bg-muted">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Creator</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{compareFrom}</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{compareTo}</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Δ $</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Δ %</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground">No revenue in either month</td></tr>
            )}
            {items.map((i) => {
              const positive = i.delta > 0;
              const negative = i.delta < 0;
              return (
                <tr key={i.code} className="border-t border-border">
                  <td className="px-4 py-2 text-sm font-display text-foreground">
                    <span className="font-medium">{i.code}</span>
                    {i.name && <span className="text-xs ml-2 text-muted-foreground">{i.name}</span>}
                  </td>
                  <td className="px-4 py-2 text-right text-sm text-foreground tabular-nums">${i.from.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right text-sm text-foreground tabular-nums">${i.to.toFixed(2)}</td>
                  <td className={`px-4 py-2 text-right text-sm font-display font-bold tabular-nums ${positive ? "text-secondary" : negative ? "text-destructive" : "text-muted-foreground"}`}>
                    {positive ? "+" : ""}${i.delta.toFixed(2)}
                  </td>
                  <td className={`px-4 py-2 text-right text-sm font-display tabular-nums ${positive ? "text-secondary" : negative ? "text-destructive" : "text-muted-foreground"}`}>
                    {i.pct === null ? "NEW" : `${i.pct >= 0 ? "+" : ""}${i.pct.toFixed(0)}%`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface Creator {
  id: string;
  code: string;
  name: string | null;
  creator_id: string | null;
}

interface RevenueEntry {
  month: string;
  rooms_bookings: number;
  rooms_gna: number;
  rooms_revenue: number;
  tours_bookings: number;
  tours_revenue: number;
  events_revenue: number;
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
  const [allRevenueRows, setAllRevenueRows] = useState<any[]>([]);
  const [compareFrom, setCompareFrom] = useState<string>("April");
  const [compareTo, setCompareTo] = useState<string>("May");

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

    // Load all revenue from the synced source-of-truth table to compute totals per creator
    const { data: allRevenue } = await supabase
      .from("creator_revenue")
      .select("creator_code, month, rd_room_revenue, hgl_revenue, events_revenue");
    setAllRevenueRows(allRevenue || []);
    const totals: Record<string, number> = {};
    const codeToId: Record<string, string> = {};
    (data || []).forEach((c: any) => { codeToId[c.code.toUpperCase()] = c.id; });
    allRevenue?.forEach((r: any) => {
      const cid = codeToId[(r.creator_code || "").toUpperCase()];
      if (!cid) return;
      totals[cid] = (totals[cid] || 0)
        + Number(r.rd_room_revenue || 0) * 0.1
        + Number(r.hgl_revenue || 0) * 0.1
        + Number(r.events_revenue || 0) * 0.1;
    });
    setCreatorTotals(totals);
  };

  const selectCreator = async (creator: Creator) => {
    setSelectedCreator(creator);
    setExpandedCreator(creator.id);
    const { data } = await supabase
      .from("creator_revenue")
      .select("*")
      .ilike("creator_code", creator.code);

    const monthMap: Record<string, RevenueEntry> = {};
    MONTHS.forEach(m => {
      monthMap[m] = { month: m, rooms_bookings: 0, rooms_gna: 0, rooms_revenue: 0, tours_bookings: 0, tours_revenue: 0, events_revenue: 0 };
    });
    data?.forEach((r: any) => {
      if (monthMap[r.month]) {
        monthMap[r.month] = {
          month: r.month,
          rooms_bookings: r.rd_bookings ?? 0,
          rooms_gna: r.rd_gna ?? 0,
          rooms_revenue: Number(r.rd_room_revenue) || 0,
          tours_bookings: r.hgl_bookings ?? 0,
          tours_revenue: Number(r.hgl_revenue) || 0,
          events_revenue: Number(r.events_revenue) || 0,
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

    const code = selectedCreator.code.toUpperCase();
    for (const r of revenue) {
      const { data: existing } = await supabase
        .from("creator_revenue")
        .select("id")
        .ilike("creator_code", code)
        .eq("month", r.month)
        .maybeSingle();

      if (existing) {
        await supabase.from("creator_revenue").update({
          rd_bookings: r.rooms_bookings,
          rd_gna: r.rooms_gna,
          rd_room_revenue: r.rooms_revenue,
          hgl_bookings: r.tours_bookings,
          hgl_revenue: r.tours_revenue,
          events_revenue: r.events_revenue,
          synced_at: new Date().toISOString(),
        }).eq("id", existing.id);
      } else {
        const hasData = r.rooms_bookings || r.rooms_revenue || r.tours_bookings || r.tours_revenue || r.events_revenue;
        if (hasData) {
          await supabase.from("creator_revenue").insert({
            creator_code: code,
            month: r.month,
            rd_bookings: r.rooms_bookings,
            rd_gna: r.rooms_gna,
            rd_room_revenue: r.rooms_revenue,
            hgl_bookings: r.tours_bookings,
            hgl_revenue: r.tours_revenue,
            events_revenue: r.events_revenue,
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


  const handleDeleteCreator = async (creator: Creator) => {
    if (!window.confirm(`Delete "${creator.code}"? This will also remove all their revenue data.`)) return;

    await supabase.from("creator_revenue").delete().ilike("creator_code", creator.code);
    const { error } = await supabase.from("creators").delete().eq("id", creator.id);

    if (error) {
      toast.error("Failed to delete creator");
    } else {
      toast.success(`${creator.code} deleted`);
      if (selectedCreator?.id === creator.id) {
        setSelectedCreator(null);
        setRevenue([]);
      }
      loadCreators();
    }
  };

  const filteredCreators = creators
    .filter(c => {
      const q = searchFilter.toLowerCase();
      return c.code.toLowerCase().includes(q) ||
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.creator_id && c.creator_id.toLowerCase().includes(q));
    })
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
      <div className="border-b border-border px-4 md:px-6 py-3 md:py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 md:gap-3">
          <img src={madMonkeyLogo} alt="Mad Monkey" className="h-8" />
          <span className="text-muted-foreground text-sm font-display">|</span>
          <h1 className="text-lg md:text-xl font-bold font-display text-foreground">Admin</h1>
        </div>
        <div className="flex items-center gap-3 md:gap-4 text-sm">
          <button
            onClick={() => setSelectedCreator(null)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Month Comparison</span>
            <span className="sm:hidden">Compare</span>
          </button>
          <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
            <span className="hidden sm:inline">View Public Page</span>
            <span className="sm:hidden">Public</span>
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="w-4 h-4" /> Logout
          </button>
          <div className="hidden md:block"><PoweredByTheoroX /></div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:h-[calc(100vh-65px)]">
        {/* Sidebar - Creator List */}
        <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-border overflow-y-auto p-4 max-h-[40vh] md:max-h-none">
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
              className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors text-sm flex items-center justify-between ${
                selectedCreator?.id === c.id
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <div>
                <span className="font-display font-medium">{c.code}</span>
                {c.creator_id && <span className="text-[10px] ml-1.5 opacity-50">{c.creator_id}</span>}
                {c.name && <span className="text-xs ml-2 opacity-70">{c.name}</span>}
              </div>
              {creatorTotals[c.id] > 0 && (
                <span className={`text-[10px] font-display font-bold ${selectedCreator?.id === c.id ? "text-primary-foreground/80" : "text-secondary"}`}>
                  ${creatorTotals[c.id].toFixed(0)}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {!selectedCreator ? (
            <MonthComparison
              rows={allRevenueRows}
              creators={creators}
              compareFrom={compareFrom}
              compareTo={compareTo}
              setCompareFrom={setCompareFrom}
              setCompareTo={setCompareTo}
            />
          ) : (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <h2 className="text-xl md:text-2xl font-bold font-display text-foreground break-words">
                  {selectedCreator.code} <span className="text-muted-foreground font-normal text-base md:text-lg">({selectedCreator.name})</span> <span className="text-muted-foreground font-normal text-xs md:text-sm">{selectedCreator.creator_id}</span>
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteCreator(selectedCreator)}
                    className="flex items-center gap-1.5 rounded-xl border border-destructive/30 text-destructive px-3 md:px-4 py-2 md:py-2.5 text-sm font-display font-medium hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                  <button
                    onClick={saveRevenue}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 md:px-5 py-2 md:py-2.5 font-display font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "Saving..." : "Save All"}
                  </button>
                </div>
              </div>

              {/* Rooms & Dorms */}
              <div className="mb-8">
                <h3 className="text-lg font-bold font-display text-secondary mb-3 flex items-center gap-2">
                  <img src={heartBadge} alt="" className="w-6 h-6" /> Rooms & Dorms
                </h3>
                <div className="rounded-2xl border border-border overflow-x-auto">
                  <table className="w-full min-w-[560px]">
                    <thead>
                      <tr className="bg-muted">
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Month</th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground"># Bookings</th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">GNA</th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Room Revenue ($)</th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">10% ($)</th>
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
                            <input type="number" step="0.01" value={r.rooms_revenue ? Number(r.rooms_revenue).toFixed(2) : ""} onChange={e => updateRevenue(r.month, "rooms_revenue", e.target.value)} className="w-28 bg-card border border-border rounded px-2 py-1 text-right text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                          </td>
                          <td className="px-4 py-2 text-right text-sm font-display font-medium text-secondary">${(Number(r.rooms_revenue) * 0.1).toFixed(2)}</td>
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
                <div className="rounded-2xl border border-border overflow-x-auto">
                  <table className="w-full min-w-[500px]">
                    <thead>
                      <tr className="bg-muted">
                        <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Month</th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground"># Bookings</th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">HGL Revenue ($)</th>
                        <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">10% ($)</th>
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
                            <input type="number" step="0.01" value={r.tours_revenue ? Number(r.tours_revenue).toFixed(2) : ""} onChange={e => updateRevenue(r.month, "tours_revenue", e.target.value)} className="w-28 bg-card border border-border rounded px-2 py-1 text-right text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                          </td>
                          <td className="px-4 py-2 text-right text-sm font-display font-medium text-accent">${(Number(r.tours_revenue) * 0.1).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Events — Dutchies only */}
              {selectedCreator.code.toUpperCase() === "DUTCHIES10" && (
                <div className="mt-8">
                  <h3 className="text-lg font-bold font-display text-primary mb-3 flex items-center gap-2">
                    <img src={lightningBadge} alt="" className="w-6 h-6" /> Events
                  </h3>
                  <div className="rounded-2xl border border-border overflow-x-auto">
                    <table className="w-full min-w-[440px]">
                      <thead>
                        <tr className="bg-muted">
                          <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Month</th>
                          <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Events Revenue ($)</th>
                          <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">10% ($)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {revenue.map(r => (
                          <tr key={r.month} className="border-t border-border">
                            <td className="px-4 py-2 text-foreground text-sm">{r.month}</td>
                            <td className="px-4 py-2 text-right">
                              <input type="number" step="0.01" value={r.events_revenue ? Number(r.events_revenue).toFixed(2) : ""} onChange={e => updateRevenue(r.month, "events_revenue", e.target.value)} className="w-28 bg-card border border-border rounded px-2 py-1 text-right text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                            </td>
                            <td className="px-4 py-2 text-right text-sm font-display font-medium text-primary">${(Number(r.events_revenue) * 0.1).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
