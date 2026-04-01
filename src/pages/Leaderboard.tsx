import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Trophy, Crown, Medal, Flame, ArrowLeft, Zap, Search, ShieldCheck } from "lucide-react";
import heartBadge from "@/assets/heart-badge.png";
import lightningBadge from "@/assets/lightning-badge.png";
import madMonkeyLogo from "@/assets/mad-monkey-logo.png";
import PoweredByTheoroX from "@/components/PoweredByTheoroX";

interface CreatorScore {
  code: string;
  name: string | null;
  roomsCommission: number;
  toursCommission: number;
  total: number;
}

const CURRENT_MONTH = new Date().toLocaleString("en-US", { month: "long" });

const Leaderboard = () => {
  const [verified, setVerified] = useState(false);
  const [creatorIdInput, setCreatorIdInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  const [leaders, setLeaders] = useState<CreatorScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"all" | "month">("all");

  const handleVerify = async () => {
    if (!creatorIdInput.trim() || !codeInput.trim()) return;
    setVerifyLoading(true);
    setVerifyError("");

    const { data: creator } = await supabase
      .from("creators")
      .select("id, creator_id")
      .ilike("code", codeInput.trim())
      .maybeSingle();

    if (!creator) { setVerifyError("Code not found."); setVerifyLoading(false); return; }
    if (!creator.creator_id || creator.creator_id.toUpperCase() !== creatorIdInput.trim().toUpperCase()) {
      setVerifyError("Creator ID doesn't match."); setVerifyLoading(false); return;
    }

    setVerified(true);
    setVerifyLoading(false);
  };

  useEffect(() => {
    if (!verified) return;
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
  }, [period, verified]);

  /* ─── VERIFICATION GATE ─── */
  if (!verified) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
        <div className="w-full max-w-sm text-center">
          <img src={madMonkeyLogo} alt="Mad Monkey" className="h-10 mx-auto mb-4" />
          <div className="flex items-center justify-center gap-2 mb-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold font-display text-foreground">Verify Access</h1>
          </div>
          <p className="text-muted-foreground text-sm mb-6">Enter your Creator ID and Code to view the leaderboard.</p>

          <div className="flex flex-col gap-2 mb-3">
            <input
              value={creatorIdInput}
              onChange={e => setCreatorIdInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && handleVerify()}
              placeholder="Creator ID (e.g. CH001)"
              className="rounded-xl bg-card border border-border px-4 py-3 text-foreground text-base font-display placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
            <div className="flex gap-2">
              <input
                value={codeInput}
                onChange={e => setCodeInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === "Enter" && handleVerify()}
                placeholder="Code (e.g. LEE10)"
                className="flex-1 rounded-xl bg-card border border-border px-4 py-3 text-foreground text-base font-display placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
              <button
                onClick={handleVerify}
                disabled={verifyLoading || !creatorIdInput.trim() || !codeInput.trim()}
                className="rounded-xl bg-primary text-primary-foreground px-5 py-3 font-display font-bold hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                style={{ boxShadow: "0 4px 14px hsl(68 100% 45% / 0.25)" }}
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>
          {verifyError && <p className="text-destructive text-sm font-medium">{verifyError}</p>}

          <Link to="/" className="inline-block mt-6 text-muted-foreground text-xs hover:text-foreground transition-colors font-display">
            ← Back to search
          </Link>
        </div>
        <div className="mt-8">
          <PoweredByTheoroX />
        </div>
      </div>
    );
  }

  /* ─── LEADERBOARD ─── */
  const topThree = leaders.slice(0, 3);
  const rest = leaders.slice(3);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card/50 border-b border-border px-5 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-display font-medium">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <img src={madMonkeyLogo} alt="Mad Monkey" className="h-7" />
          </div>
          <div className="w-16" />
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-primary/5 to-transparent">
        <div className="max-w-3xl mx-auto px-5 pt-8 pb-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold font-display text-foreground tracking-tight">
              Creator Leaderboard
            </h1>
          </div>
          <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto mb-5">
            See who's earning the most commission. Compete, climb the ranks, and claim the crown.
          </p>

          {/* Period toggle */}
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

          {/* Icon Key */}
          <div className="flex items-center justify-center gap-5 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <img src={heartBadge} alt="" className="w-4 h-4" /> Rooms
            </span>
            <span className="flex items-center gap-1.5">
              <img src={lightningBadge} alt="" className="w-4 h-4" /> Tours
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-6">
        <div className="max-w-3xl mx-auto">
          {loading ? (
            <div className="text-center py-16 text-muted-foreground font-display">Loading…</div>
          ) : leaders.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground font-display">No earnings data yet.</div>
          ) : (
            <>
              {/* Podium — top 3 */}
              {topThree.length > 0 && (
                <div className="grid grid-cols-3 gap-3 md:gap-5 mb-10 items-end max-w-xl mx-auto">
                  {/* 2nd place */}
                  {topThree[1] ? (
                    <PodiumCard rank={2} creator={topThree[1]} height="h-36 md:h-40" />
                  ) : <div />}
                  {/* 1st place */}
                  <PodiumCard rank={1} creator={topThree[0]} height="h-44 md:h-52" />
                  {/* 3rd place */}
                  {topThree[2] ? (
                    <PodiumCard rank={3} creator={topThree[2]} height="h-36 md:h-36" />
                  ) : <div />}
                </div>
              )}

              {/* Rest of list */}
              {rest.length > 0 && (
                <div className="space-y-2">
                  {rest.map((creator, i) => (
                    <div
                      key={creator.code}
                      className="flex items-center gap-3 rounded-xl bg-card border border-border p-3 md:p-4 hover:border-primary/30 transition-colors"
                    >
                      <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold font-display text-muted-foreground shrink-0">
                        {i + 4}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-bold text-foreground text-sm truncate">
                          {creator.name || creator.code}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <img src={heartBadge} alt="Rooms" className="w-3 h-3" />
                            ${creator.roomsCommission.toFixed(0)}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <img src={lightningBadge} alt="Tours" className="w-3 h-3" />
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
              )}
            </>
          )}
        </div>
      </div>

      <div className="border-t border-border py-4 text-center flex flex-col items-center gap-1">
        <Link to="/" className="text-muted-foreground text-xs hover:text-foreground transition-colors font-display">
          ← Search your code
        </Link>
        <PoweredByTheoroX />
      </div>
    </div>
  );
};

/* ─── Podium card ─── */
function PodiumCard({ rank, creator, height }: { rank: number; creator: CreatorScore; height: string }) {
  const colors = {
    1: "from-yellow-400/20 to-yellow-500/5 border-yellow-400/40 shadow-yellow-400/10",
    2: "from-gray-300/20 to-gray-400/5 border-gray-400/30",
    3: "from-amber-500/20 to-amber-600/5 border-amber-500/30",
  } as const;

  const icons = {
    1: <Crown className="w-8 h-8 text-yellow-500" />,
    2: <Medal className="w-7 h-7 text-gray-400" />,
    3: <Medal className="w-6 h-6 text-amber-600" />,
  } as const;

  const rankLabel = { 1: "1st", 2: "2nd", 3: "3rd" } as const;

  return (
    <div className={`${height} rounded-2xl bg-gradient-to-b ${colors[rank as 1|2|3]} border flex flex-col items-center justify-end p-2 md:p-4 text-center shadow-lg overflow-hidden`}>
      {icons[rank as 1|2|3]}
      <span className="text-[9px] md:text-[10px] font-display font-bold text-muted-foreground uppercase tracking-wider mt-1">
        {rankLabel[rank as 1|2|3]}
      </span>
      <p className="font-display font-bold text-foreground text-[11px] md:text-sm mt-1 w-full leading-tight break-words line-clamp-2">
        {creator.name || creator.code}
      </p>
      <div className="flex flex-col md:flex-row items-center gap-0.5 md:gap-3 mt-1 text-[10px] md:text-[11px] text-muted-foreground">
        <span className="flex items-center gap-0.5">
          <img src={heartBadge} alt="Rooms" className="w-3 h-3" />
          ${creator.roomsCommission.toFixed(0)}
        </span>
        <span className="flex items-center gap-0.5">
          <img src={lightningBadge} alt="Tours" className="w-3 h-3" />
          ${creator.toursCommission.toFixed(0)}
        </span>
      </div>
      <p className="font-display font-bold text-primary text-base md:text-xl mt-1">
        ${creator.total.toFixed(0)}
      </p>
    </div>
  );
}

export default Leaderboard;
