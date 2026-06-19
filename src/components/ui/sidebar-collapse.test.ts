import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("sidebar collapsed CSS fallback", () => {
  it("defines explicit desktop width rules for icon-collapsed state", () => {
    const globalsCss = readFileSync(
      join(process.cwd(), "src/app/globals.css"),
      "utf8"
    );

    expect(globalsCss).toContain(
      '[data-slot="sidebar"][data-collapsible="icon"]'
    );
    expect(globalsCss).toContain("width: var(--sidebar-width-icon)");
  });
});
