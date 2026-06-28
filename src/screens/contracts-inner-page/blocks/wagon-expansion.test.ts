import { describe, expect, it } from "vitest";

import {
  areAllVisibleWagonGroupsExpanded,
  getVisibleApplicationIds,
  getVisibleWagonExpansionState,
} from "./wagon-expansion";

const visibleGroups = [
  {
    application: { id: 101, name: "Февраль" },
    wagons: [{ id: 1 }, { wagon_id: 2 }],
  },
  {
    application: { id: "none", name: "Без заявки" },
    wagons: [{ id: "wagon-3" }],
  },
];

describe("wagon expansion helpers", () => {
  it("builds expansion state for every visible application and wagon", () => {
    expect(getVisibleApplicationIds(visibleGroups)).toEqual(["101", "none"]);
    expect(getVisibleWagonExpansionState(visibleGroups)).toEqual({
      "1": true,
      "2": true,
      "wagon-3": true,
    });
  });

  it("requires both application accordions and wagon rows to be expanded", () => {
    expect(
      areAllVisibleWagonGroupsExpanded(
        visibleGroups,
        { "1": true, "2": true, "wagon-3": true },
        ["101", "none"]
      )
    ).toBe(true);

    expect(
      areAllVisibleWagonGroupsExpanded(
        visibleGroups,
        { "1": true, "2": true, "wagon-3": true },
        ["101"]
      )
    ).toBe(false);
  });
});
