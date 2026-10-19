import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import type { InternalAxiosRequestConfig } from "axios";
import { mockProcurement } from "./mock-procurement";

beforeEach(async () => {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase("sungrain-procurement-demo-v1");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
});
const call = (url: string, method = "get", data?: unknown, params?: Record<string, unknown>) =>
  mockProcurement({
    url,
    method,
    data,
    params,
    headers: {},
  } as InternalAxiosRequestConfig) as Promise<any>;
const form = (overrides: Record<string, string> = {}, pdf = false) => {
  const data = new FormData();
  Object.entries({
    farmId: "9101",
    cultureName: "Пшеница 3 класс",
    quantity: "100",
    unitPrice: "100000",
    currency: "KZT",
    vatMode: "INCLUSIVE",
    vatRate: "16",
    agreementNumber: "MOCK-TEST",
    agreementDate: "2026-10-18",
    notes: "",
    requestId: "unit-test-request",
    ...overrides,
  }).forEach(([key, value]) => data.append(key, value));
  if (pdf)
    data.append(
      "file",
      new Blob(["%PDF-1.7\nSynthetic test"], { type: "application/pdf" }),
      "agreement.pdf",
    );
  return data;
};
describe("procurement mock persistence", () => {
  it("returns synthetic farms and seeded purchases", async () => {
    expect((await call("/procurement/purchases/options")).farms).toHaveLength(
      3,
    );
    expect((await call("/procurement/purchases")).rows).toHaveLength(3);
  });
  it("persists a purchase and its document across separate requests", async () => {
    const created = await call(
      "/procurement/purchases",
      "post",
      form({}, true),
    );
    expect(created.totalAmount).toBe("10000000.00");
    expect(created.file).toBeUndefined();
    const loaded = await call(`/procurement/purchases/${created.id}`);
    expect(loaded.document.name).toBe("agreement.pdf");
    const file = await call(`/procurement/purchases/${created.id}/document`);
    expect(await file.text()).toBe("%PDF-1.7\nSynthetic test");
  });
  it("deduplicates creates and rejects stale edits", async () => {
    const first = await call("/procurement/purchases", "post", form());
    const retry = await call("/procurement/purchases", "post", form());
    expect(retry.id).toBe(first.id);
    const updated = await call(
      `/procurement/purchases/${first.id}`,
      "patch",
      form({ quantity: "125.5", version: "1", requestId: "" }),
    );
    expect(updated.version).toBe(2);
    expect(updated.totalAmount).toBe("12550000.00");
    await expect(
      call(
        `/procurement/purchases/${first.id}`,
        "patch",
        form({ version: "1" }),
      ),
    ).rejects.toMatchObject({ response: { status: 409 } });
  });
  it("rejects disguised files and removes saved documents", async () => {
    const invalid = form();
    invalid.append("file", new Blob(["not a pdf"]), "test.pdf");
    await expect(
      call("/procurement/purchases", "post", invalid),
    ).rejects.toMatchObject({ response: { status: 400 } });
    const created = await call(
      "/procurement/purchases",
      "post",
      form({}, true),
    );
    const updated = await call(
      `/procurement/purchases/${created.id}`,
      "patch",
      form({ version: "1", removeDocument: "true", requestId: "" }),
    );
    expect(updated.document).toBeNull();
    await expect(
      call(`/procurement/purchases/${created.id}/document`),
    ).rejects.toMatchObject({ response: { status: 404 } });
  });
  it("keeps a manually created farm in the registry and links its purchases", async () => {
    const farm = await call("/procurement/farmers", "post", JSON.stringify({
      organizationName: 'КХ "Новое"', leaderName: "Фермер", phone: "",
      regionName: "Павлодарская область", district: "", ruralDistrict: "", totalAreaHa: 25,
    }));
    expect(farm.importId).toBeNull();
    const registry = await call("/procurement/farmers");
    expect(registry.rows.some((row: { id: number }) => row.id === farm.id)).toBe(true);
    const options = await call("/procurement/purchases/options");
    expect(options.farms.some((row: { id: number }) => row.id === farm.id)).toBe(true);
    const purchase = await call("/procurement/purchases", "post", form({ farmId: String(farm.id) }));
    const detail = await call(`/procurement/farmers/${farm.id}`);
    expect(detail.purchases.map((row: { id: string }) => row.id)).toContain(purchase.id);
    await expect(call(`/procurement/farmers/${farm.id}`, "patch", JSON.stringify({ ...farm, organizationName: "Новое имя", version: 0 }))).rejects.toMatchObject({ response: { status: 409 } });
    const updated = await call(`/procurement/farmers/${farm.id}`, "patch", JSON.stringify({ ...farm, organizationName: "Новое имя", version: 1 }));
    expect(updated.version).toBe(2);
    await expect(call("/procurement/farmers/9101", "patch", JSON.stringify({ ...farm, version: 1 }))).rejects.toMatchObject({ response: { status: 400 } });
  });
  it("rejects a missing import rather than showing manual farms", async () => {
    await expect(call("/procurement/farmers", "get", undefined, { importId: 999 })).rejects.toMatchObject({ response: { status: 404 } });
  });
});
