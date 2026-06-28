import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("wagon edit dialog layout", () => {
  const source = readFileSync(resolve(__dirname, "wagon-registry.tsx"), "utf8");

  it("uses the CRM modal shell with reachable footer and structured sections", () => {
    expect(source).toContain("grid h-[94vh] max-h-[880px]");
    expect(source).toContain("grid-rows-[auto_minmax(0,1fr)_auto]");
    expect(source).toContain("crm-scrollbar min-h-0 overflow-y-auto");
    expect(source).toContain("Операционная карточка вагона");
    expect(source).toContain("Параметры вагона");
    expect(source).toContain("Документы вагона");
    expect(source).toContain("shrink-0 border-t border-[#dfe7de]");
  });
});
