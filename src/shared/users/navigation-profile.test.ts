import { describe, expect, it } from "vitest";
import { accountingNavigationIncludes, usesAccountingNavigation } from "./navigation-profile";

const token = (id: number | string) =>
  `header.${btoa(JSON.stringify({ id })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")}.signature`;

describe("accounting navigation preference", () => {
  it("applies only to the specified account", () => {
    expect(usesAccountingNavigation(token(3))).toBe(true);
    expect(usesAccountingNavigation(token("3"))).toBe(true);
    expect(usesAccountingNavigation(token(4))).toBe(false);
    expect(usesAccountingNavigation(null)).toBe(false);
    expect(usesAccountingNavigation("invalid-token")).toBe(false);
  });

  it("shows contracts, finance and procurement without unrelated menu items", () => {
    expect(["/admin/contracts", "/admin/finance", "/admin/procurement"].every(accountingNavigationIncludes)).toBe(true);
    expect(["/admin", "/admin/approach", "/admin/cultures", "/admin/users"].some(accountingNavigationIncludes)).toBe(false);
  });
});
