import { describe, expect, it } from "vitest";
import { accountingNavigationIncludes, getTokenUserId, usesAccountingNavigation } from "./navigation-profile";

const token = (id: number | string) =>
  `header.${btoa(JSON.stringify({ id })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")}.signature`;

describe("accounting navigation preference", () => {
  it("separates cache identities and rejects malformed or unsafe ids", () => {
    expect(getTokenUserId(token(3))).toBe(3);
    expect(getTokenUserId(token("4"))).toBe(4);
    expect(getTokenUserId(token(0))).toBeNull();
    expect(getTokenUserId(token("3e1"))).toBeNull();
    expect(getTokenUserId("invalid-token")).toBeNull();
  });
  it("applies only to the specified account", () => {
    expect(usesAccountingNavigation(token(3))).toBe(true);
    expect(usesAccountingNavigation(token("3"))).toBe(true);
    expect(usesAccountingNavigation(token(4))).toBe(false);
    expect(usesAccountingNavigation(null)).toBe(false);
    expect(usesAccountingNavigation("invalid-token")).toBe(false);
  });

  it("shows contracts and procurement without unrelated menu items", () => {
    expect(["/admin/contracts", "/admin/procurement"].every(accountingNavigationIncludes)).toBe(true);
    expect(["/admin", "/admin/finance", "/admin/approach", "/admin/cultures", "/admin/users"].some(accountingNavigationIncludes)).toBe(false);
  });
});
