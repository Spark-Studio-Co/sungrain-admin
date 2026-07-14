import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("dashboard shipped volume", () => {
  const source = readFileSync(
    resolve(__dirname, "dashboard-block.tsx"),
    "utf8",
  );

  it("uses actual shipped wagon metadata instead of application request volumes", () => {
    expect(source).toContain("getContractOpsMeta");
    expect(source).toContain("const opsMeta = getContractOpsMeta(contract);");
    expect(source).toContain("const shippedVolume = opsMeta.shippedVolume;");
    expect(source).not.toContain("Calculate shipped volume from applications");
    expect(source).not.toContain(
      "(sum: number, app: any) => sum + (Number(app.volume) || 0)",
    );
  });

  it("uses computed application totals for dashboard finance cards", () => {
    expect(source).toContain("const computedContractValue");
    expect(source).toMatch(
      /estimatedCost:\s*computedContractValue > 0\s*\? computedContractValue/,
    );
    expect(source).toContain(
      "acc[company].totalValue[contract.currency] += contract.totalValue",
    );
  });

  it("keeps dashboard finance money labels compact and contained", () => {
    expect(source).toContain("formatCompactCurrencyValue");
    expect(source).toContain("max-w-full break-words");
    expect(source).toContain("shrink-0 text-right");
  });
});
