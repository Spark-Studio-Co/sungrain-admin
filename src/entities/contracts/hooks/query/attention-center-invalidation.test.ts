import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUpdateContract } from "../mutations/use-update-contract.mutation";
import { useDeleteContract } from "../mutations/use-delete-contract.mutations";
import { useUpdateApplication } from "@/entities/applications/hooks/mutations/use-update-application.mutation";
import { useDeleteApplication } from "@/entities/applications/hooks/mutations/use-delete-application.mutation";
import { useAddWagon } from "@/entities/wagon/hooks/mutations/use-add-wagon.mutation";
import { useDeleteWagon } from "@/entities/wagon/hooks/mutations/use-delete-wagon.mutation";
import { useUpdateWagon } from "@/entities/wagon/hooks/mutations/use-update-wagon.mutation";

const { invalidateQueries, useMutationMock } = vi.hoisted(() => ({
  invalidateQueries: vi.fn(),
  useMutationMock: vi.fn((options) => options),
}));

vi.mock("@tanstack/react-query", async (importOriginal) => ({
  ...await importOriginal<typeof import("@tanstack/react-query")>(),
  useQueryClient: () => ({ invalidateQueries }),
  useMutation: useMutationMock,
}));

beforeEach(() => vi.clearAllMocks());

describe("attention center cache updates", () => {
  it.each([
    ["update contract", useUpdateContract],
    ["delete contract", useDeleteContract],
    ["update application", useUpdateApplication],
    ["delete application", useDeleteApplication],
    ["add wagon", useAddWagon],
    ["delete wagon", useDeleteWagon],
  ])("refreshes arrivals after %s", async (_name, useHook) => {
    useHook();
    await useMutationMock.mock.calls[0][0].onSuccess({ id: 101 });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["attention-center"] });
  });

  it("refreshes after wagon details and file updates", async () => {
    useUpdateWagon();
    for (const [options] of useMutationMock.mock.calls) {
      invalidateQueries.mockClear();
      await options.onSuccess();
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["attention-center"] });
    }
  });

  it("keeps application invalidation when the caller supplies its own success handler", async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();
    useUpdateApplication({ onSuccess, onError, retry: 2 });
    const options = useMutationMock.mock.calls[0][0];
    const data = { id: 101 };
    const variables = { id: 101, destination_stations: ["Демо станция"] };
    await options.onSuccess(data, variables, undefined, undefined);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["attention-center"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["application", "101"] });
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith(data, variables, undefined, undefined);
    expect(options.onError).toBe(onError);
    expect(options.retry).toBe(2);
  });
});
