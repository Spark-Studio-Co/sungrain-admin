import { describe, expect, it } from "vitest";

import { getWagonExpansionId } from "./wagon-expansion";

describe("wagon expansion helpers", () => {
  it("builds expansion ids from wagon rows only", () => {
    expect(getWagonExpansionId({ id: 1 })).toBe("1");
    expect(getWagonExpansionId({ wagon_id: 2 })).toBe("2");
    expect(getWagonExpansionId({ wagon: { id: "inner" } })).toBe("inner");
    expect(getWagonExpansionId({ number: "95005757" })).toBe("95005757");
  });

  it("does not expose application-group expansion helpers anymore", async () => {
    const wagonExpansionModule = await import("./wagon-expansion");

    expect(wagonExpansionModule).not.toHaveProperty("getVisibleApplicationIds");
    expect(wagonExpansionModule).not.toHaveProperty("getVisibleWagonExpansionState");
    expect(wagonExpansionModule).not.toHaveProperty(
      "areAllVisibleWagonGroupsExpanded"
    );
  });
});
