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
const call = (url: string, method = "get", data?: FormData) =>
  mockProcurement({
    url,
    method,
    data,
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
    vatMode: "EXCLUSIVE",
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
    expect(created.totalAmount).toBe("11600000.00");
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
    expect(updated.totalAmount).toBe("14558000.00");
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
});
