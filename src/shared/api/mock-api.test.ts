import { afterEach, describe, expect, it } from "vitest";
import { mockApiAdapter, shouldUseMockApi } from "./mock-api";

const request = async (url: string, options: Record<string, unknown> = {}) => {
  const response = await mockApiAdapter({
    url,
    method: "get",
    headers: {},
    ...options,
  } as any);

  return response.data;
};

describe("mockApiAdapter", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_USE_MOCK_API;
  });

  it("keeps the real backend enabled by default", () => {
    delete process.env.NEXT_PUBLIC_USE_MOCK_API;

    expect(shouldUseMockApi()).toBe(false);
  });

  it("uses the mock adapter only when explicitly requested", () => {
    process.env.NEXT_PUBLIC_USE_MOCK_API = "true";

    expect(shouldUseMockApi()).toBe(true);
  });

  it("returns paginated contract data with nested CRM entities", async () => {
    const data = await request("/contract", {
      params: { page: 1, limit: 2 },
    });

    expect(data.data).toHaveLength(2);
    expect(data.total).toBeGreaterThan(2);
    expect(data.totalPages).toBeGreaterThan(1);
    expect(data.data[0]).toMatchObject({
      number: expect.any(String),
      crop: expect.any(String),
      company: expect.objectContaining({ name: expect.any(String) }),
      applications: expect.any(Array),
      wagons: expect.any(Array),
      files: expect.any(Array),
    });
  });

  it("creates contracts in memory so local forms can work without backend", async () => {
    const before = await request("/contract", {
      params: { page: 1, limit: 100 },
    });

    await request("/contract/add-data", {
      method: "post",
      data: JSON.stringify({
        crop: "Пшеница 3 класс",
        sender: "ТОО Северный элеватор",
        receiver: "Sungrain Terminal",
        departureStation: "Костанай",
        destinationStation: "Сарыагаш",
        totalVolume: 1500,
      }),
    });

    const after = await request("/contract", {
      params: { page: 1, limit: 100 },
    });

    expect(after.total).toBe(before.total + 1);
    expect(after.data[0]).toMatchObject({
      crop: "Пшеница 3 класс",
      total_volume: 1500,
    });
  });
});
