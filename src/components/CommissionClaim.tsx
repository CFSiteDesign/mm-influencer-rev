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
  </div>
);

export default CommissionClaim;
