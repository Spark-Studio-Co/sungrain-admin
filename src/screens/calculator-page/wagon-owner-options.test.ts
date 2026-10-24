import { beforeEach, describe, expect, it, vi } from "vitest";
import { getOwners } from "@/entities/owner/api/get/get-owners.api";
import { getWagonOwnerNames } from "./wagon-owner-options";

vi.mock("@/entities/owner/api/get/get-owners.api", () => ({
  getOwners: vi.fn(),
}));
const get = vi.mocked(getOwners);
beforeEach(() => vi.resetAllMocks());

describe("calculator wagon owner options", () => {
  it("loads every page rather than limiting selection to the first page", async () => {
    get.mockResolvedValueOnce({
      data: [{ owner: "Первый собственник" }],
      total: 2,
      page: 1,
      lastPage: 2,
    });
    get.mockResolvedValueOnce({
      data: [{ owner: "Последний собственник" }],
      total: 2,
      page: 2,
      lastPage: 2,
    });
    expect(await getWagonOwnerNames()).toEqual([
      "Первый собственник",
      "Последний собственник",
    ]);
    expect(get.mock.calls).toEqual([
      [{ page: 1, limit: 100 }],
      [{ page: 2, limit: 100 }],
    ]);
  });

  it("removes blank and duplicate names without changing valid names", async () => {
    get.mockResolvedValue({
      data: [{ owner: " ТОО «Транс» " }, { owner: "ТОО «Транс»" }, { owner: "  " }, { owner: null }],
      total: 4,
      page: 1,
      lastPage: 1,
    });
    expect(await getWagonOwnerNames()).toEqual(["ТОО «Транс»"]);
  });

  it("supports an empty directory", async () => {
    get.mockResolvedValue({ data: [], total: 0, page: 1, lastPage: 0 });
    expect(await getWagonOwnerNames()).toEqual([]);
    expect(get).toHaveBeenCalledTimes(1);
  });

  it("rejects a partial directory when a later page fails", async () => {
    get.mockResolvedValueOnce({
      data: [{ owner: "Первый" }],
      total: 2,
      page: 1,
      lastPage: 2,
    });
    get.mockRejectedValueOnce(new Error("offline"));
    await expect(getWagonOwnerNames()).rejects.toThrow("offline");
  });
});
