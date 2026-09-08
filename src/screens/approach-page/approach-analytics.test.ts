import { describe, expect, it } from "vitest";
import type { ApproachRow } from "@/entities/approach/api/approach.api";
import {
  buildCultureDestinationGroups,
  getApproachCargoCategory,
} from "./approach-analytics";

const row = (
  id: number,
  cargoName: string,
  currentStation: string,
  recipient: string | null,
  tons: number,
): ApproachRow => ({
  id,
  importId: 1,
  sourceRow: id,
  currentStation,
  wagonNumber: `95${id}`,
  code: null,
  cargoName,
  tons,
  recipient,
  departureStation: null,
  trainIndex: null,
  containerNumber: null,
  rawData: null,
  createdAt: "2026-08-17T00:00:00.000Z",
});

describe("approach culture analytics", () => {
  it("uses the same grain categories for common cargo spellings", () => {
    expect(getApproachCargoCategory("Пшеница продовольственная")).toBe(
      "Пшеница",
    );
    expect(getApproachCargoCategory("Зерно кукурузы")).toBe("Кукуруза");
    expect(getApproachCargoCategory("BARLEY")).toBe("Ячмень");
    expect(getApproachCargoCategory("Шрот подсолнечный")).toBe("Шрот");
    expect(getApproachCargoCategory("soybean meal")).toBe("Шрот");
    expect(getApproachCargoCategory("Жмых рапсовый")).toBe("Жмых");
    expect(getApproachCargoCategory("Кунжара")).toBe("Жмых");
    expect(getApproachCargoCategory("Масло подс.")).toBe(
      "Масло подсолнечное",
    );
    expect(getApproachCargoCategory("Подсолнечное масло")).toBe(
      "Масло подсолнечное",
    );
    expect(getApproachCargoCategory("sunflower oil")).toBe(
      "Масло подсолнечное",
    );
    expect(getApproachCargoCategory("ДСП")).toBeNull();
    expect(getApproachCargoCategory("Бензин АИ-92")).toBeNull();
  });

  it("groups a selected culture by station and recipient", () => {
    const groups = buildCultureDestinationGroups(
      [
        row(1, "Пшеница", "Худжанд", "Ирода Инвест", 70),
        row(2, "Wheat", "Худжанд", "Ирода Инвест", 68),
        row(3, "Пшеница", "Спитамен", "Анхор", 62),
        row(4, "Кукуруза", "Худжанд", "Ирода Инвест", 70),
      ],
      "Пшеница",
    );

    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({
      station: "Худжанд",
      recipient: "Ирода Инвест",
      wagons: 2,
      tons: 138,
    });
    expect(groups[0].wagonNumbers).toEqual(["951", "952"]);
    expect(groups[0].share).toBeCloseTo(69);
  });
});
