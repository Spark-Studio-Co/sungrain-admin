import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("mobile sidebar navigation", () => {
  const source = readFileSync(
    join(process.cwd(), "src/components/ui/sidebar.tsx"),
    "utf8"
  );

  it("closes the mobile sheet after a menu item is selected", () => {
    expect(source).toContain("const { isMobile, state, setOpenMobile } = useSidebar()");
    expect(source).toContain("if (isMobile && !event.defaultPrevented)");
    expect(source).toContain("setOpenMobile(false)");
  });
});
