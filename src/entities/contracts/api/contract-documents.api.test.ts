import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteContractDocument,
  uploadContractDocuments,
} from "./contract-documents.api";
import {
  getMainContractFile,
  validateContractDocumentFiles,
} from "../model/contract-documents";

const { post, patch } = vi.hoisted(() => ({ post: vi.fn(), patch: vi.fn() }));
vi.mock("@/shared/api/apiClient", () => ({ apiClient: { post, patch } }));

describe("contract documents", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps each file aligned with its type and readable title in a batch", async () => {
    const first = new File(["waybill"], "Накладная №4.pdf");
    const second = new File(["act"], "Акт.xlsx");
    post.mockResolvedValueOnce({ data: { files: [1, 2] } });
    await uploadContractDocuments({
      contractId: "c-1",
      documents: [
        { file: first, name: " Накладная №4 ", type: "railway_waybill" },
        { file: second, name: " ", type: "act" },
      ],
    });
    const [url, body] = post.mock.lastCall!;
    expect(url).toBe("/contract/upload-files/c-1");
    expect(body.getAll("files")).toEqual([first, second]);
    expect(JSON.parse(body.get("files_info"))).toEqual([
      expect.objectContaining({
        name: "Накладная №4",
        document_type: "railway_waybill",
      }),
      expect.objectContaining({ name: "Акт.xlsx", document_type: "act" }),
    ]);
  });

  it("deletes one physical file even when titles coincide", async () => {
    patch.mockResolvedValueOnce({ data: { files: [] } });
    await deleteContractDocument({
      contractId: "c-1",
      document: { name: "Накладная", location: "/uploads/unique.pdf" },
    });
    expect(patch).toHaveBeenCalledWith("/contract/delete-files/c-1", {
      files_info: [{ name: "Накладная", location: "/uploads/unique.pdf" }],
    });
    await expect(
      deleteContractDocument({
        contractId: "c-1",
        document: { name: "Накладная" },
      }),
    ).rejects.toThrow();
    expect(patch).toHaveBeenCalledTimes(1);
  });

  it("rejects empty, oversized and excessive batches before upload", async () => {
    const file = new File(["file"], "a.pdf");
    expect(validateContractDocumentFiles([])).toBeTruthy();
    expect(validateContractDocumentFiles(Array(11).fill(file))).toBeTruthy();
    expect(
      validateContractDocumentFiles([{ size: 50 * 1024 * 1024 + 1 } as File]),
    ).toBeTruthy();
    await expect(
      uploadContractDocuments({ contractId: "c-1", documents: [] }),
    ).rejects.toThrow();
    expect(post).not.toHaveBeenCalled();
  });

  it("keeps the header download on the contract rather than a waybill", () => {
    const old = { location: "/old.pdf" };
    const agreement = { document_type: "contract", location: "/contract.pdf" };
    const waybill = {
      document_type: "railway_waybill",
      location: "/waybill.pdf",
    };
    expect(getMainContractFile([waybill, old])).toBe(old);
    expect(getMainContractFile([waybill, agreement])).toBe(agreement);
    expect(getMainContractFile([waybill])).toBeUndefined();
    expect(getMainContractFile(null)).toBeUndefined();
  });
});
