import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const app = join(process.cwd(), "src/app");
const clientRoutes = readdirSync(app, { recursive: true })
  .map(String)
  .filter((file) => file.endsWith("page.tsx"))
  .filter((file) => readFileSync(join(app, file), "utf8").includes("ssr: false"));

describe("client-only route loading", () => {
  it.each(clientRoutes)("%s has a visible fallback", (file) => {
    const source = readFileSync(join(app, file), "utf8");
    expect(source).toContain("loading: CrmRouteLoading");
  });

  it.each(["admin", "contracts"])("%s has a route-segment fallback", (segment) => {
    expect(readFileSync(join(app, segment, "loading.tsx"), "utf8"))
      .toContain("CrmRouteLoading as default");
  });

  it("uses client navigation from an invoice to its contract", () => {
    const source = readFileSync(
      join(process.cwd(), "src/screens/finances-page/finances-page.tsx"),
      "utf8",
    );
    expect(source).toContain("<Link href={selectedInvoiceContractHref}>");
    expect(source).not.toContain("<a href={selectedInvoiceContractHref}>");
  });
});
