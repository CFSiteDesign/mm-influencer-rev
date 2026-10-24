import { describe, expect, it } from "vitest";
import { commissionRate, commissionTotal } from "@/lib/commission";

describe("BALIPM10 exclusive commission", () => {
  it("starts at 20% in October 2026", () => {
    expect(commissionRate("BALIPM10", "October", 2026)).toBe(0.2);
    expect(commissionRate("BALIPM10", "September", 2026)).toBe(0.1);
  });
  it("includes July 2027 and returns to 10% in August", () => {
    expect(commissionRate("BALIPM10", "July", 2027)).toBe(0.2);
    expect(commissionRate("BALIPM10", "August", 2027)).toBe(0.1);
  });
  it("does not reprice historical months based on today's date", () => {
    expect(commissionRate("BALIPM10", "July")).toBe(0.1);
    expect(commissionRate("BALIPM10", "October")).toBe(0.2);
  });
  it("keeps every other creator at 10%", () => {
    expect(commissionRate("SHANE10", "October", 2026)).toBe(0.1);
    expect(commissionRate("BALIMPM10", "October", 2026)).toBe(0.1);
  });
  it("applies the 20% deal to HAMISH10 (same creator as BALIPM10)", () => {
    expect(commissionRate("HAMISH10", "October", 2026)).toBe(0.2);
    expect(commissionRate("HAMISH10", "September", 2026)).toBe(0.1);
    expect(commissionTotal("HAMISH10", "October", 100, 200, 300, 25)).toBe(145);
  });
  it("applies 20% to beds tours and events without multiplying ALL IN", () => {
    expect(commissionTotal("BALIPM10", "October", 100, 200, 300, 25)).toBe(145);
  });
  it("handles normalised codes", () => {
    expect(commissionRate(" balipm10 ", "October", 2026)).toBe(0.2);
  });
});