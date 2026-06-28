import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("wagon details application relation", () => {
  const source = readFileSync(resolve(__dirname, "wagon-details.tsx"), "utf8");

  it("shows which application every wagon row belongs to", () => {
    expect(source).toContain("const applicationLabel");
    expect(source).toContain("Приложение строки вагона");
    expect(source).toContain("{applicationLabel}");
    expect(source).toContain("К какому приложению относится вагон");
  });
});
