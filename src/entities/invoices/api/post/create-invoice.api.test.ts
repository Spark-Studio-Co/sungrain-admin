import { describe, expect, it, vi } from "vitest";
import { createInvoice } from "./create-invoice.api";

const { post } = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock("@/shared/api/apiClient", () => ({ apiClient: { post } }));

describe("createInvoice api", () => {
  it.each([false, true])("submits the invoice with attachment: %s", async (attach) => {
    const file = attach ? new File(["test invoice"], "invoice.pdf") : undefined;
    post.mockResolvedValueOnce({ data: { id: 1 } });

    await expect(createInvoice({
      applicationId: 42,
      name: "Тестовый счет",
      amount: 12500,
      date: "2026-11-05",
      status: "pending",
      file,
    })).resolves.toEqual({ id: 1 });

    const [url, body] = post.mock.lastCall!;
    expect(url).toBe("/application/add-invoice/42/invoice");
    expect(body).toBeInstanceOf(FormData);
    expect(body.get("amount")).toBe("12500");
    expect(body.get("files")).toBe(file ?? null);
  });
});
