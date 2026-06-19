import { describe, expect, it } from "vitest";
import { getAuthRedirect } from "./route-policy";

describe("getAuthRedirect", () => {
  it("waits for auth hydration before redirecting protected routes", () => {
    expect(
      getAuthRedirect({
        pathname: "/admin/contracts",
        hasToken: false,
        isAdmin: null,
        isAuthHydrated: false,
      })
    ).toBeNull();
  });

  it("sends guests to login outside the login route", () => {
    expect(
      getAuthRedirect({
        pathname: "/admin/contracts",
        hasToken: false,
        isAdmin: null,
      })
    ).toBe("/login");
  });

  it("allows guests into protected routes when local auth bypass is enabled", () => {
    expect(
      getAuthRedirect({
        pathname: "/admin/contracts",
        hasToken: false,
        isAdmin: null,
        bypassGuestAccess: true,
      })
    ).toBeNull();
  });

  it("sends authenticated admins away from login and root to admin dashboard", () => {
    expect(
      getAuthRedirect({
        pathname: "/login",
        hasToken: true,
        isAdmin: true,
      })
    ).toBe("/admin");

    expect(
      getAuthRedirect({
        pathname: "/",
        hasToken: true,
        isAdmin: true,
      })
    ).toBe("/admin");
  });

  it("keeps admins inside admin routes", () => {
    expect(
      getAuthRedirect({
        pathname: "/admin/users",
        hasToken: true,
        isAdmin: true,
      })
    ).toBeNull();
  });

  it("keeps regular users in contracts and blocks admin routes", () => {
    expect(
      getAuthRedirect({
        pathname: "/contracts/42",
        hasToken: true,
        isAdmin: false,
      })
    ).toBeNull();

    expect(
      getAuthRedirect({
        pathname: "/admin/users",
        hasToken: true,
        isAdmin: false,
      })
    ).toBe("/contracts");
  });
});
