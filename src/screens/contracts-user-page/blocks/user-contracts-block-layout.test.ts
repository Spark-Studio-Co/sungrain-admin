import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("user contracts page layout", () => {
  const source = readFileSync(
    resolve(__dirname, "user-contracts-block.tsx"),
    "utf8"
  );

  it("keeps content away from the card border", () => {
    expect(source).toContain("px-4 pt-0 sm:px-6 lg:px-8");
    expect(source).toContain("px-4 pb-4 sm:px-6 lg:px-8");
    expect(source).not.toContain("CardHeader className=\"px-0 pt-0\"");
    expect(source).not.toContain("CardContent className=\"px-0 pb-0\"");
  });
});
