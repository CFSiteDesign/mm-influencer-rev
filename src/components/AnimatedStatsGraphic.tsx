import { ThumbsUp, Heart, TrendingUp, Star, Zap } from "lucide-react";

const AnimatedStatsGraphic = () => {
  return (
    <div className="relative w-full max-w-xs mx-auto h-48 overflow-hidden">
      {/* Rising graph SVG */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 180" fill="none">
        <path
          d="M20 150 Q60 140 80 120 T140 90 T200 50 T260 25 T290 15"
          stroke="hsl(var(--primary))"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          strokeDasharray="200"
          style={{ animation: 'graph-draw 2s ease-out forwards' }}
        />
        <path
          d="M20 150 Q60 140 80 120 T140 90 T200 50 T260 25 T290 15 V180 H20 Z"
          fill="hsl(var(--primary) / 0.08)"
        />
        {/* Grid lines */}
        {[40, 80, 120].map(y => (
          <line key={y} x1="20" y1={y} x2="290" y2={y} stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="4 4" />
        ))}
      </svg>

      {/* Floating icons */}
      <div className="absolute top-6 left-6" style={{ animation: 'pulse-grow 2s ease-in-out infinite' }}>
        <div className="bg-secondary/15 rounded-full p-2">
          <Heart className="w-4 h-4 text-secondary" />
        </div>
      </div>

      <div className="absolute top-10 right-10" style={{ animation: 'pulse-grow 2.5s ease-in-out infinite 0.3s' }}>
        <div className="bg-primary/15 rounded-full p-2">
          <ThumbsUp className="w-4 h-4 text-primary-foreground" style={{ color: 'hsl(var(--primary))' }} />
        </div>
      </div>

      <div className="absolute bottom-12 left-12" style={{ animation: 'pulse-grow 3s ease-in-out infinite 0.6s' }}>
        <div className="bg-accent/15 rounded-full p-2">
          <Star className="w-4 h-4 text-accent" />
        </div>
      </div>

      <div className="absolute top-4 left-1/2" style={{ animation: 'pulse-grow 2.2s ease-in-out infinite 1s' }}>
        <div className="bg-primary/15 rounded-full p-1.5">
          <Zap className="w-3 h-3" style={{ color: 'hsl(var(--primary))' }} />
        </div>
      </div>

      {/* Floating numbers */}
      <div
        className="absolute top-16 right-6 font-display font-bold text-lg text-secondary"
        style={{ animation: 'count-pop 0.6s ease-out forwards 0.5s', opacity: 0 }}
      >
        +24%
      </div>

      <div
        className="absolute bottom-8 right-16 font-display font-bold text-sm text-accent"
        style={{ animation: 'count-pop 0.6s ease-out forwards 0.8s', opacity: 0 }}
      >
        1.2K
      </div>

      <div
        className="absolute bottom-16 left-4 font-display font-bold text-xs text-muted-foreground"
        style={{ animation: 'count-pop 0.6s ease-out forwards 1.1s', opacity: 0 }}
      >
        $420
      </div>

      {/* Rising arrow */}
      <div className="absolute bottom-4 right-4" style={{ animation: 'pulse-grow 2s ease-in-out infinite 0.5s' }}>
        <div className="bg-primary rounded-lg p-2 shadow-md" style={{ boxShadow: '0 4px 14px hsl(var(--primary) / 0.3)' }}>
          <TrendingUp className="w-5 h-5 text-primary-foreground" />
        </div>
      </div>
    </div>
  );
};

export default AnimatedStatsGraphic;
