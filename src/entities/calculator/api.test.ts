import { beforeEach, describe, expect, it, vi } from "vitest";
import { tradeApi, type CalculationInput, type ServiceInput } from "./api";

const { get, post } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock("@/shared/api/apiClient", () => ({ apiClient: { get, post } }));

describe("calculator request deadlines", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    get.mockResolvedValue({ data: [] });
    post.mockResolvedValue({ data: {} });
  });

  it("bounds editor catalog and saved-input requests", async () => {
    await tradeApi.elevators();
    await tradeApi.options();
    await tradeApi.get("saved-id");
    expect(get.mock.calls).toEqual([
      ["/elevators", { timeout: 15_000 }],
      ["/calculator/options", { timeout: 15_000 }],
      ["/calculator/calculations/saved-id", { timeout: 15_000 }],
    ]);
  });

  it("bounds preview and save without changing the draft or fingerprint", async () => {
    const input = {
      requestId: "draft-id",
      schemaVersion: 2,
    } as CalculationInput;
    await tradeApi.preview(input);
    await tradeApi.save(input, "preview-fingerprint");
    expect(post.mock.calls).toEqual([
      ["/calculator/preview", input, { timeout: 30_000 }],
      [
        "/calculator/calculations",
        { ...input, previewFingerprint: "preview-fingerprint" },
        { timeout: 30_000 },
      ],
    ]);
  });

  it("preserves optional and selected service crops in API requests", async () => {
    const input: ServiceInput = {
      name: "Отгрузка",
      unit: "TONNE",
      price: "2100",
      effectiveFrom: "2026-10-25",
      overtimeEligible: false,
      alternativeGroup: "",
    };
    for (const service of [
      input,
      { ...input, culture: null },
      { ...input, culture: "Пшеница" },
    ]) {
      await tradeApi.addService("elevator", service);
      expect(post).toHaveBeenLastCalledWith(
        "/elevators/elevator/services",
        service,
      );
    }
  });
});
