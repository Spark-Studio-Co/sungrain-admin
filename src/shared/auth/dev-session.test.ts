import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { shouldBypassAuthLocally } from "./dev-session";

describe("shouldBypassAuthLocally", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      location: {
        hostname: "localhost",
      },
    });
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_AUTH_BYPASS;
    vi.unstubAllGlobals();
  });

  it("does not bypass real backend auth by default", () => {
    delete process.env.NEXT_PUBLIC_AUTH_BYPASS;

    expect(shouldBypassAuthLocally()).toBe(false);
  });

  it("bypasses auth locally only when explicitly requested", () => {
    process.env.NEXT_PUBLIC_AUTH_BYPASS = "true";

    expect(shouldBypassAuthLocally()).toBe(true);
  });
});
