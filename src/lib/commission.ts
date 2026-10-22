// Month-only synced records currently belong to the dashboard's active 2026 dataset.
export const REVENUE_YEAR = 2026;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function commissionRate(code: string, month: string, year = REVENUE_YEAR): number {
  const monthIndex = MONTHS.indexOf(month);
  if (monthIndex < 0) return 0.1;
  const period = year * 12 + monthIndex;
  return code.trim().toUpperCase() === "BALIPM10" &&
    period >= 2026 * 12 + 9 && period <= 2027 * 12 + 6 ? 0.2 : 0.1;
}

export function commissionTotal(code: string, month: string, rooms: number, tours: number, events: number, allin: number, year = REVENUE_YEAR): number {
  return (rooms + tours + events) * commissionRate(code, month, year) + allin;
}

export function commissionDealNote(code: string): string | null {
  return code.trim().toUpperCase() === "BALIPM10"
    ? "Exclusive commission: 20% on Beds, Travel + Tours and Events from October 2026 through 31 July 2027; 10% outside this period. ALL IN remains a flat fee."
    : null;
}