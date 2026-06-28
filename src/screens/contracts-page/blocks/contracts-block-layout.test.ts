import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("contracts edit dialog layout", () => {
  const source = readFileSync(
    resolve(__dirname, "contracts-block.tsx"),
    "utf8"
  );

  it("keeps the edit footer reachable while the form body scrolls", () => {
    expect(source).toContain("flex max-h-[calc(100vh-2rem)]");
    expect(source).toContain("supports-[height:100dvh]:max-h-[calc(100dvh-2rem)]");
    expect(source).toContain("min-h-0 flex-1 overflow-y-auto");
    expect(source).toContain("shrink-0 border-t border-[#dfe7de]");
    expect(source).not.toContain("max-h-[calc(92vh-190px)]");
  });
});
