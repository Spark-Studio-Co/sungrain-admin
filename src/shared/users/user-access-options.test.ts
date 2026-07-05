import { describe, expect, it } from "vitest";
import {
  getCompanyOptions,
  getContractsForCompanies,
  getContractOptions,
  pruneContractIdsForCompanies,
} from "./user-access-options";

const companies = [
  { id: 1, name: "SUN GRAIN LOGISTICS" },
  { id: "2", name: "TOO Sungrain Export" },
];

const contracts = [
  { id: "c-1", number: "SG-1", title: "Пшеница", companyId: 1 },
  { id: "c-2", number: "SG-2", title: "", companyId: "2" },
  { id: "c-3", number: "SG-3", name: "Рапс", companyId: 3 },
];

describe("user access options", () => {
  it("normalizes companies into string-valued multi-select options", () => {
    expect(getCompanyOptions(companies)).toEqual([
      { value: "1", label: "SUN GRAIN LOGISTICS" },
      { value: "2", label: "TOO Sungrain Export" },
    ]);
  });

  it("keeps only contracts that belong to selected companies", () => {
    expect(getContractsForCompanies(contracts, ["1", "2"])).toEqual([
      contracts[0],
      contracts[1],
    ]);
  });

  it("formats contract labels for the multi-select", () => {
    expect(getContractOptions([contracts[0], contracts[1]])).toEqual([
      { value: "c-1", label: "SG-1 - Пшеница" },
      { value: "c-2", label: "SG-2 - Без названия" },
    ]);
  });

  it("removes selected contracts when their company is no longer selected", () => {
    expect(
      pruneContractIdsForCompanies(["c-1", "c-2", "unknown"], contracts, ["2"])
    ).toEqual(["c-2", "unknown"]);
  });
});
