import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Trophy, Crown, Medal, Flame, ArrowLeft } from "lucide-react";
import heartBadge from "@/assets/heart-badge.png";
import lightningBadge from "@/assets/lightning-badge.png";

interface CreatorScore {
  code: string;
  name: string | null;
  roomsCommission: number;
  toursCommission: number;
  total: number;
}

const CURRENT_MONTH = new Date().toLocaleString("en-US", { month: "long" });

const Leaderboard = () => {
  const [leaders, setLeaders] = useState<CreatorScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"all" | "month">("all");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: creators } = await supabase.from("creators").select("id, code, name");
      if (!creators?.length) { setLoading(false); return; }

      const { data: revenue } = await supabase.from("creator_monthly_revenue").select("*");

      const map: Record<string, CreatorScore> = {};
      creators.forEach(c => {
        map[c.id] = { code: c.code, name: c.name, roomsCommission: 0, toursCommission: 0, total: 0 };
      });

      revenue?.forEach((r: any) => {
        if (!map[r.creator_id]) return;
        if (period === "month" && r.month !== CURRENT_MONTH) return;
        const rooms = Number(r.rooms_revenue) * 0.1;
        const tours = Number(r.tours_revenue) * 0.1;
        map[r.creator_id].roomsCommission += rooms;
        map[r.creator_id].toursCommission += tours;
        map[r.creator_id].total += rooms + tours;
      });

      const sorted = Object.values(map)
        .filter(c => c.total > 0)
        .sort((a, b) => b.total - a.total);

      setLeaders(sorted);
      setLoading(false);
    };
    load();
  }, [period]);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-6 text-center text-sm font-bold text-muted-foreground">{index + 1}</span>;
  };

  const topThree = leaders.slice(0, 3);
  const rest = leaders.slice(3);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card/50 border-b border-border px-5 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-display font-medium">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            <span className="text-lg font-bold font-display text-foreground">Leaderboard</span>
          </div>
          <div className="w-16" />
        </div>
      </div>

      {/* Period toggle */}
      <div className="max-w-2xl mx-auto w-full px-5 pt-5">
        <div className="flex rounded-xl bg-muted p-1 max-w-xs mx-auto">
          <button
            onClick={() => setPeriod("all")}
            className={`flex-1 rounded-lg py-2 text-sm font-display font-bold transition-all ${period === "all" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            All Time
          </button>
          <button
            onClick={() => setPeriod("month")}
            className={`flex-1 rounded-lg py-2 text-sm font-display font-bold transition-all ${period === "month" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {CURRENT_MONTH}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-6">
        <div className="max-w-2xl mx-auto">
          {loading ? (
            <div className="text-center py-16 text-muted-foreground font-display">Loading…</div>
          ) : leaders.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground font-display">No earnings data yet.</div>
          ) : (
            <>
              {/* Podium — top 3 */}
              {topThree.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-8 items-end">
                  {/* 2nd place */}
                  {topThree[1] ? (
                    <PodiumCard rank={2} creator={topThree[1]} height="h-32" />
                  ) : <div />}
                  {/* 1st place */}
                  <PodiumCard rank={1} creator={topThree[0]} height="h-40" />
                  {/* 3rd place */}
                  {topThree[2] ? (
                    <PodiumCard rank={3} creator={topThree[2]} height="h-28" />
                  ) : <div />}
                </div>
              )}

              {/* Rest of list */}
              <div className="space-y-2">
                {rest.map((creator, i) => (
                  <div
                    key={creator.code}
                    className="flex items-center gap-3 rounded-xl bg-card border border-border p-3 hover:border-primary/30 transition-colors"
                  >
                    {getRankIcon(i + 3)}
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-foreground text-sm truncate">
                        {creator.name || creator.code}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <img src={heartBadge} alt="" className="w-3 h-3" />
                          ${creator.roomsCommission.toFixed(0)}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <img src={lightningBadge} alt="" className="w-3 h-3" />
                          ${creator.toursCommission.toFixed(0)}
                        </span>
                      </div>
                    </div>
                    <p className="font-display font-bold text-primary text-base">
                      ${creator.total.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="border-t border-border py-4 text-center">
        <Link to="/" className="text-muted-foreground text-xs hover:text-foreground transition-colors font-display">
          ← Search your code
        </Link>
      </div>
    </div>
  );
};

/* ─── Podium card ─── */
function PodiumCard({ rank, creator, height }: { rank: number; creator: CreatorScore; height: string }) {
  const colors = {
    1: "from-yellow-400/20 to-yellow-500/5 border-yellow-400/40",
    2: "from-gray-300/20 to-gray-400/5 border-gray-400/30",
    3: "from-amber-500/20 to-amber-600/5 border-amber-500/30",
  } as const;

  const icons = {
    1: <Crown className="w-7 h-7 text-yellow-500" />,
    2: <Medal className="w-6 h-6 text-gray-400" />,
    3: <Medal className="w-5 h-5 text-amber-600" />,
  } as const;

  return (
    <div className={`${height} rounded-2xl bg-gradient-to-b ${colors[rank as 1|2|3]} border flex flex-col items-center justify-end p-3 text-center`}>
      {icons[rank as 1|2|3]}
      <p className="font-display font-bold text-foreground text-sm mt-1 truncate w-full">
        {creator.name || creator.code}
      </p>
      <div className="flex items-center gap-2 mt-1">
        <img src={heartBadge} alt="" className="w-3 h-3" />
        <img src={lightningBadge} alt="" className="w-3 h-3" />
      </div>
      <p className="font-display font-bold text-primary text-lg mt-0.5">
        ${creator.total.toFixed(0)}
      </p>
    </div>
  );
}

export default Leaderboard;
