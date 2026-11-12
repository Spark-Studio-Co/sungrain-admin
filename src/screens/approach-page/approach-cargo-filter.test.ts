import { describe, expect, it } from "vitest";
import { buildApproachCargoFilter } from "./approach-cargo-filter";

describe("approach cargo filter", () => {
  it("selects all sunflower oil spelling variants together without changing source names", () => {
    const names = ["масло подс", "масло подс.", "масло подсол", "масло подсолнечное", "Подсолнечное масло", "sunflower oil", "Пшеница"];
    const result = buildApproachCargoFilter(names);
    expect(result.options).toEqual(["Масло подсолнечное", "Пшеница"]);
    expect(names.filter((name) => result.labels.get(name) === "Масло подсолнечное")).toEqual(names.slice(0, 6));
  });

  it("combines unambiguous abbreviations and punctuation without combining extra qualifiers", () => {
    const names = ["Шрот соев", "шрот соев.", "Шрот соевый", "Шрот соевый гранулированный", "Пшеница 3 класса", "Пшеница 4 класса"];
    const result = buildApproachCargoFilter(names);
    expect(result.labels.get(names[0])).toBe(result.labels.get(names[2]));
    expect(result.labels.get(names[1])).toBe(result.labels.get(names[2]));
    expect(result.labels.get(names[3])).not.toBe(result.labels.get(names[2]));
    expect(result.labels.get(names[4])).not.toBe(result.labels.get(names[5]));
  });

  it("does not guess an ambiguous abbreviated word or mix different oils", () => {
    const names = ["Шрот подсол", "Шрот подсолнечный", "Шрот подсоленный", "Масло рапсовое", "Масло подс", "Масло моторное"];
    const result = buildApproachCargoFilter(names);
    expect(result.labels.get(names[0])).not.toBe(result.labels.get(names[1]));
    expect(result.labels.get(names[0])).not.toBe(result.labels.get(names[2]));
    expect(result.labels.get(names[3])).not.toBe(result.labels.get(names[4]));
    expect(result.labels.get(names[5])).not.toBe(result.labels.get(names[4]));
  });

  it("matches abbreviations before the same qualifier without mixing different qualifiers", () => {
    const names = ["Масло подс. раф.", "Масло подсолнечное рафинированное", "Масло подс. нераф.", "Масло подсолнечное нерафинированное", "Масло подс", "Пшеница 2024", "Пшеница 20240"];
    const result = buildApproachCargoFilter(names);
    expect(result.labels.get(names[0])).toBe(result.labels.get(names[1]));
    expect(result.labels.get(names[2])).toBe(result.labels.get(names[3]));
    expect(result.labels.get(names[0])).not.toBe(result.labels.get(names[2]));
    expect(result.labels.get(names[0])).not.toBe(result.labels.get(names[4]));
    expect(result.labels.get(names[5])).not.toBe(result.labels.get(names[6]));
    expect(buildApproachCargoFilter([names[0]]).options).toEqual(["Масло подсолнечное рафинированное"]);
  });

  it("handles empty names and produces the same groups regardless of row order", () => {
    const names = ["масло подс.", "масло подсол", "Пшеница", "пшеница.", null, " "];
    const forward = buildApproachCargoFilter(names);
    const backward = buildApproachCargoFilter([...names].reverse());
    expect(forward.options).toEqual(backward.options);
    expect(forward.labels.get("Пшеница")).toBe(forward.labels.get("пшеница."));
    expect(forward.options).toHaveLength(2);
  });

  it("keeps unusually long spreadsheet values as exact names", () => {
    const first = `Груз ${"а".repeat(1000)}`;
    const second = `${first}б`;
    const result = buildApproachCargoFilter([first, second]);
    expect(result.options).toHaveLength(2);
    expect(result.labels.get(first)).toBe(first);
  });
});
