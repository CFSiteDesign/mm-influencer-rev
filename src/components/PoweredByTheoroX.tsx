import theoroxLogo from "@/assets/theorox-logo.png";

const PoweredByTheoroX = () => (
  <div className="flex items-center justify-center gap-1.5 py-3 opacity-40 hover:opacity-70 transition-opacity">
    <span className="text-[11px] text-muted-foreground font-medium tracking-wide">Powered by</span>
    <img src={theoroxLogo} alt="TheoroX" className="h-[14px] w-auto" />
  </div>
);

export default PoweredByTheoroX;
