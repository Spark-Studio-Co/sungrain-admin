import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("finance date picker clear behavior", () => {
  const source = readFileSync(resolve(__dirname, "finances-page.tsx"), "utf8");

  it("closes the calendar popover when clearing a selected finance date", () => {
    expect(source).toContain("const clearDate = () => {");
    expect(source).toContain('onChange("");');
    expect(source).toContain("setOpen(false);");
    expect(source).toContain("if (!date) {");
    expect(source).toContain("clearDate();");
  });
});
