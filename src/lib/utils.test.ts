import { describe, expect, it } from "vitest";

import { formatMoney, normalizeCurrencyLabel } from "./utils";

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
