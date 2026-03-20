import { Bed, Plane, DollarSign, TrendingUp, Users, Percent } from "lucide-react";

const AnimatedStatsGraphic = () => {
  // Monthly revenue bar data (simulated)
  const bars = [35, 42, 38, 55, 48, 62, 70, 65, 78, 85, 72, 90];
  const barLabels = ["J","F","M","A","M","J","J","A","S","O","N","D"];
  const maxBar = Math.max(...bars);

  return (
    <div className="relative w-full mx-auto">
      {/* Mini stat pills */}
      <div className="flex gap-2 mb-3">
        <div
          className="flex items-center gap-1.5 rounded-lg bg-secondary/10 border border-secondary/20 px-2.5 py-1.5"
          style={{ animation: "count-pop 0.5s ease-out forwards 0.3s", opacity: 0 }}
        >
          <Bed className="w-3.5 h-3.5 text-secondary" />
          <span className="text-[11px] font-display font-bold text-secondary">142 Bookings</span>
        </div>
        <div
          className="flex items-center gap-1.5 rounded-lg bg-accent/10 border border-accent/20 px-2.5 py-1.5"
          style={{ animation: "count-pop 0.5s ease-out forwards 0.5s", opacity: 0 }}
        >
          <Plane className="w-3.5 h-3.5 text-accent" />
          <span className="text-[11px] font-display font-bold text-accent">58 Tours</span>
        </div>
      </div>

      {/* Bar chart */}
      <div className="bg-card/50 rounded-xl p-3 mb-3 border border-border/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-display font-medium text-muted-foreground uppercase tracking-wider">Monthly Revenue</span>
          <div className="flex items-center gap-1" style={{ animation: "count-pop 0.5s ease-out forwards 0.7s", opacity: 0 }}>
            <TrendingUp className="w-3 h-3 text-primary" style={{ color: "hsl(var(--primary))" }} />
            <span className="text-[11px] font-display font-bold" style={{ color: "hsl(var(--primary))" }}>+34%</span>
          </div>
        </div>
        <div className="flex items-end gap-[3px] h-20">
          {bars.map((val, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-sm"
                style={{
                  height: `${(val / maxBar) * 100}%`,
                  background: i >= 9
                    ? "hsl(var(--primary))"
                    : i >= 6
                      ? "hsl(var(--primary) / 0.6)"
                      : "hsl(var(--primary) / 0.25)",
                  animation: `count-pop 0.4s ease-out forwards ${0.1 + i * 0.06}s`,
                  opacity: 0,
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-[3px] mt-1">
          {barLabels.map((l, i) => (
            <span key={i} className="flex-1 text-center text-[7px] text-muted-foreground font-display">{l}</span>
          ))}
        </div>
      </div>

      {/* Bottom row: commission + creators */}
      <div className="grid grid-cols-2 gap-2">
        <div
          className="rounded-lg bg-card/50 border border-border/50 p-2.5"
          style={{ animation: "count-pop 0.5s ease-out forwards 1s", opacity: 0 }}
        >
          <div className="flex items-center gap-1 mb-1">
            <DollarSign className="w-3 h-3 text-secondary" />
            <span className="text-[9px] font-display text-muted-foreground uppercase tracking-wider">Commission</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-display font-bold text-secondary">$4,280</span>
            <Percent className="w-2.5 h-2.5 text-muted-foreground" />
          </div>
        </div>
        <div
          className="rounded-lg bg-card/50 border border-border/50 p-2.5"
          style={{ animation: "count-pop 0.5s ease-out forwards 1.2s", opacity: 0 }}
        >
          <div className="flex items-center gap-1 mb-1">
            <Users className="w-3 h-3 text-accent" />
            <span className="text-[9px] font-display text-muted-foreground uppercase tracking-wider">Creators</span>
          </div>
          <span className="text-lg font-display font-bold text-accent">63+</span>
        </div>
      </div>
    </div>
  );
};

export default AnimatedStatsGraphic;
