import { FileText } from "lucide-react";
import affiliateBreakdown from "@/assets/affiliate-breakdown.png";

const COMMISSION_PDF_URL =
  "https://madmonkey-wp.sgp1.cdn.digitaloceanspaces.com/creator-hub-commission-agreement.pdf";

/**
 * Affiliate breakdown diagram (from the welcome email) above a
 * "How to claim my Commission" button linking to the commission agreement PDF.
 * Shown at the bottom of both the landing page and the earnings page.
 */
const CommissionClaim = () => (
  <div className="flex flex-col items-center gap-4">
    <img
      src={affiliateBreakdown}
      alt="Affiliate breakdown: what each product pays creators"
      className="w-full max-w-md"
      loading="lazy"
    />
    <a
      href={COMMISSION_PDF_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-3 font-display font-bold text-sm hover:brightness-110 active:scale-95 transition-all"
      style={{ boxShadow: "0 4px 14px hsl(68 100% 45% / 0.25)" }}
    >
      <FileText className="w-4 h-4" />
      How to claim my Commission
    </a>
    {/* Claim deadline notice (Mad Monkey, Oct 2026). */}
    <p className="max-w-md text-center text-[11px] leading-snug text-muted-foreground">
      <span className="font-semibold">Important:</span> All commissions must be claimed within 3 months of being
      awarded via invoice. For the avoidance of doubt, all commissions awarded in January must be invoiced by
      11th April. Full terms and conditions{" "}
      <a href={COMMISSION_PDF_URL} target="_blank" rel="noopener noreferrer" className="underline text-primary">
        here
      </a>
      .
    </p>
  </div>
);

export default CommissionClaim;
