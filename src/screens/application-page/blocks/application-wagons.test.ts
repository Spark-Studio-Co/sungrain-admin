import { describe, expect, it } from "vitest";
import { getApplicationScopedWagons } from "./application-wagons";

describe("getApplicationScopedWagons", () => {
  it("keeps only wagons that belong to the current application", () => {
    const scoped = getApplicationScopedWagons({
      id: 4,
      wagons: [
        { id: 1, applicationId: 4 },
        { id: 2, application_id: "4" },
        { id: 3, application: { id: 4 } },
        { id: 4, wagon: { applicationId: 4 } },
        { id: 5, applicationId: 5 },
        { id: 6, application_id: "6" },
        { id: 7, application: { id: 7 } },
      ],
    });

    expect(scoped.map((wagon) => wagon.id)).toEqual([1, 2, 3, 4]);
  });

  it("returns an empty list when no wagon belongs to the application", () => {
    expect(
      getApplicationScopedWagons({
        id: 10,
        wagons: [{ id: 1, applicationId: 4 }],
      })
    ).toEqual([]);
  });
});
