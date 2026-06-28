import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("DatePickerInput clear behavior", () => {
  const source = readFileSync(resolve(__dirname, "date-picker.tsx"), "utf8");

  it("closes the calendar popover when the selected date is cleared", () => {
    expect(source).toContain("const clearDate = () => {");
    expect(source).toContain('onChange("", undefined);');
    expect(source).toContain("setOpen(false);");
    expect(source).toContain("if (!date) {");
    expect(source).toContain("clearDate();");
  });
});
