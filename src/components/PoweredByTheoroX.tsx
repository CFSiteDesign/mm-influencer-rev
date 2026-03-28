import theoroxLogo from "@/assets/theorox-logo.png";

const PoweredByTheoroX = () => (
  <div className="flex items-center justify-center gap-2 py-3 opacity-40 hover:opacity-70 transition-opacity">
    <span className="text-xs text-muted-foreground font-medium tracking-wide">Powered by</span>
    <img src={theoroxLogo} alt="TheoroX" className="h-[30px] w-auto" />
  </div>
);

export default PoweredByTheoroX;
