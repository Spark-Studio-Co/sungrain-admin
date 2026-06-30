import { describe, expect, it } from "vitest";
import {
  getOrderedWagonStatuses,
  sortWagonsByStatusGroup,
} from "./wagon-sort";

describe("wagon status sorting", () => {
  it("keeps wagon statuses grouped in the operational order", () => {
    const rows = [
      { wagon: { number: "1", status: "at_elevator" } },
      { wagon: { number: "2", status: "shipped" } },
      { wagon: { number: "3", status: "at_elevator" } },
      { wagon: { number: "4", status: "in_transit" } },
      { wagon: { number: "5", status: "shipped" } },
    ];

    expect(sortWagonsByStatusGroup(rows).map((row) => row.wagon.status)).toEqual([
      "shipped",
      "shipped",
      "in_transit",
      "at_elevator",
      "at_elevator",
    ]);
  });

  it("sorts dates only inside each status group", () => {
    const rows = [
      { wagon: { number: "1", status: "at_elevator", date_of_unloading: null } },
      { wagon: { number: "2", status: "shipped", date_of_unloading: "2026-06-29" } },
      { wagon: { number: "3", status: "shipped", date_of_unloading: "2026-06-30" } },
      { wagon: { number: "4", status: "at_elevator", date_of_unloading: null } },
    ];

    expect(sortWagonsByStatusGroup(rows, "newest").map((row) => row.wagon.number)).toEqual([
      "3",
      "2",
      "1",
      "4",
    ]);
  });

  it("returns status tabs in the same fixed order as rows", () => {
    expect(getOrderedWagonStatuses(["at_elevator", "shipped", "in_transit"])).toEqual([
      "shipped",
      "in_transit",
      "at_elevator",
    ]);
  });
});
