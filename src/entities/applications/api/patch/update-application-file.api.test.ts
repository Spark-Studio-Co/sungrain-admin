import { describe, expect, it, vi } from "vitest";
import { updateApplicationFile } from "./update-application-file.api";
const { patch } = vi.hoisted(() => ({
  patch: vi.fn().mockResolvedValue({ data: {} }),
}));
vi.mock("@/shared/api/apiClient", () => ({ apiClient: { patch } }));
describe("application file metadata", () => {
  it("sends explicit empty values and identifies the original file safely", async () => {
    await updateApplicationFile({
      applicationId: 4,
      fileNumber: "/uploads/a.pdf",
      number: "",
      date: "",
    });
    const [url, body] = patch.mock.lastCall!;
    expect(url).toBe("/application/update-file/4/file/%2Fuploads%2Fa.pdf");
    expect(body.has("number")).toBe(true);
    expect(body.get("number")).toBe("");
    expect(body.get("date")).toBe("");
  });
});
