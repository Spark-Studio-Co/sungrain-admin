import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("legacy application page tabs", () => {
  const source = readFileSync(resolve(__dirname, "application-page.tsx"), "utf8");

  it("does not expose a separate application details tab", () => {
    expect(source).toContain('useState("documents")');
    expect(source).not.toContain('value="details"');
    expect(source).not.toContain("Детали заявки");
  });
});
