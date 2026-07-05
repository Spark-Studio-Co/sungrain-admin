import { describe, expect, it } from "vitest";
import {
  buildCreateUserPayload,
  getCreateUserValidationError,
  isCompanyRequiredForRole,
} from "./create-user-payload";

describe("create user payload helpers", () => {
  it("allows accountant users without a company", () => {
    const form = {
      email: " bookkeeper@sungrain.kz ",
      password: " Delta2005_5@ ",
      full_name: " Бухгалтер SUNGRAIN ",
      role: "ACCOUNTANT",
      companyId: [],
      contractIds: [],
    };

    expect(isCompanyRequiredForRole(form.role)).toBe(false);
    expect(getCreateUserValidationError(form)).toBeNull();
    expect(buildCreateUserPayload(form)).toEqual({
      email: "bookkeeper@sungrain.kz",
      password: "Delta2005_5@",
      full_name: "Бухгалтер SUNGRAIN",
      role: "ACCOUNTANT",
    });
  });

  it("requires companies for non-accountant users", () => {
    const form = {
      email: "manager@sungrain.kz",
      password: "secret123",
      full_name: "Менеджер",
      role: "USER",
      companyId: [],
      contractIds: [],
    };

    expect(isCompanyRequiredForRole(form.role)).toBe(true);
    expect(getCreateUserValidationError(form)).toBe(
      "Для этой роли выберите хотя бы одну компанию."
    );
  });

  it("normalizes numeric company ids and keeps contract ids as strings", () => {
    expect(
      buildCreateUserPayload({
        email: "manager@sungrain.kz",
        password: "secret123",
        full_name: "Менеджер",
        role: "USER",
        companyId: ["1", "2"],
        contractIds: ["SG-1", "SG-2"],
      })
    ).toEqual({
      email: "manager@sungrain.kz",
      password: "secret123",
      full_name: "Менеджер",
      role: "USER",
      companyId: [1, 2],
      contractIds: ["SG-1", "SG-2"],
    });
  });
});
