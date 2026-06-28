import { describe, expect, it } from "vitest";

import { formatMoney, formatNumber, normalizeCurrencyLabel } from "./utils";

describe("number formatting", () => {
  it("rounds floating point artifacts before adding thousands separators", () => {
    expect(formatNumber(419.44999999999993)).toBe("419,45");
    expect(formatNumber(4580.55)).toBe("4.580,55");
  });

  it("keeps integer thousands formatting unchanged", () => {
    expect(formatNumber(212660)).toBe("212.660");
  });
});

describe("money formatting", () => {
  it("renders exactly one currency label", () => {
    expect(formatMoney(212660, "USD")).toBe("212.660 USD");
    expect(formatMoney(212660, "KZT")).toBe("212.660 ₸");
    expect(formatMoney(212660, "₸")).toBe("212.660 ₸");
  });

  it("normalizes currency labels from api values", () => {
    expect(normalizeCurrencyLabel("usd")).toBe("USD");
    expect(normalizeCurrencyLabel("kzt")).toBe("₸");
    expect(normalizeCurrencyLabel(null)).toBe("₸");
  });
});
