import { describe, expect, it } from "vitest";
import type { InternalAxiosRequestConfig } from "axios";
import { mockApiAdapter } from "./mock-api";

describe("mock contract documents", () => {
  it("persists a batch and removes only the selected same-name attachment", async () => {
    const call = async (url: string, method = "get", data?: unknown) =>
      (
        await mockApiAdapter({
          url,
          method,
          data,
          headers: {},
        } as InternalAxiosRequestConfig)
      ).data;
    const created = await call("/contract/add-data", "post", {
      number: "QA-MOCK-DOCS",
      name: "Documents QA",
    });
    const before = created.files.length;
    const body = new FormData();
    body.append("files", new File(["one"], "Накладная.pdf"));
    body.append("files", new File(["two"], "Накладная.pdf"));
    body.append(
      "files_info",
      JSON.stringify([
        { name: "Накладная №4", document_type: "railway_waybill" },
        { name: "Накладная №4", document_type: "goods_waybill" },
      ]),
    );
    await call(`/contract/upload-files/${created.id}`, "post", body);
    const saved = await call(`/contract/${created.id}`);
    expect(saved.files).toHaveLength(before + 2);
    const [first, second] = saved.files.slice(-2);
    expect(first.document_type).toBe("railway_waybill");
    expect(second.document_type).toBe("goods_waybill");
    expect(first.location).not.toBe(second.location);
    await call(`/contract/delete-files/${created.id}`, "patch", {
      files_info: [first],
    });
    const updated = await call(`/contract/${created.id}`);
    expect(updated.files).toHaveLength(before + 1);
    expect(updated.files.at(-1)).toEqual(second);
  });
});
