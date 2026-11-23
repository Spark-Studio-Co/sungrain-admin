import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

const { query, fetchWagons } = vi.hoisted(() => ({
  query: vi.fn((options) => options),
  fetchWagons: vi.fn(async (id: string) => [{ number: `wagon-${id}` }]),
}));

vi.mock("@tanstack/react-query", async (original) => ({
  ...await original<typeof import("@tanstack/react-query")>(),
  useQuery: query,
}));
vi.mock("../../api/get/get-contract-wagons.api", () => ({ getContractWagons: fetchWagons }));

import { useGetWagonContracts } from "./use-get-contract-wagon.query";

describe("contract wagon cache", () => {
  it("keeps wagon results separate when switching contracts", async () => {
    const cache = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
    const first = useGetWagonContracts("contract-a") as any;
    const second = useGetWagonContracts("contract-b") as any;
    expect(await cache.fetchQuery(first)).toEqual([{ number: "wagon-contract-a" }]);
    expect(await cache.fetchQuery(second)).toEqual([{ number: "wagon-contract-b" }]);
    expect(fetchWagons).toHaveBeenCalledTimes(2);
    cache.clear();
  });
});
