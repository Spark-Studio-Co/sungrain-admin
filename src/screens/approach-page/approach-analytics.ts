import type { ApproachRow } from "@/entities/approach/api/approach.api";

const GRAIN_CARGO_CATEGORIES = [
  {
    name: "Шрот",
    pattern:
      /шрот|\bshrot\b|\b(?:soy(?:bean)?|sunflower|rapeseed|oilseed)\s+meal\b/i,
  },
  {
    name: "Жмых",
    pattern:
      /жмых|кунжар|кунҷор|\bkunjara\b|\boil[\s-]?cake\b|\bpress(?:ed)?[\s-]?cake\b/i,
  },
  {
    name: "Масло подсолнечное",
    pattern:
      /масло\s+подс[а-яё.]*|подсолнечн[а-яё]*\s+масло|\bsunflower\s+oil\b/i,
  },
  { name: "Пшеница", pattern: /пшениц|wheat/i },
  { name: "Ячмень", pattern: /ячмен|barley/i },
  { name: "Кукуруза", pattern: /кукуруз|\b(?:corn|maize)\b/i },
  { name: "Овес", pattern: /ов[её]с|овс|\boats?\b/i },
  { name: "Рожь", pattern: /рож|\brye\b/i },
  { name: "Просо", pattern: /прос|\bmillet\b/i },
  { name: "Гречиха", pattern: /греч|\bbuckwheat\b/i },
  { name: "Рис", pattern: /\bрис|\brice\b/i },
  { name: "Сорго", pattern: /сорго|\bsorghum\b/i },
  { name: "Тритикале", pattern: /тритикал|\btriticale\b/i },
  { name: "Зерно", pattern: /\bзерн|\bgrain\b/i },
] as const;

export type CultureDestinationGroup = {
  station: string;
  recipient: string;
  wagons: number;
  tons: number;
  share: number;
  wagonNumbers: string[];
};

export const getApproachCargoCategory = (cargoName?: string | null) => {
  const value = cargoName?.trim();
  if (!value) return null;

  return (
    GRAIN_CARGO_CATEGORIES.find(({ pattern }) => pattern.test(value))?.name ??
    null
  );
};

export const buildCultureDestinationGroups = (
  rows: ApproachRow[],
  cultureName: string,
): CultureDestinationGroup[] => {
  const cultureRows = rows.filter(
    (row) => getApproachCargoCategory(row.cargoName) === cultureName,
  );
  const totalTons = cultureRows.reduce((sum, row) => sum + (row.tons || 0), 0);
  const groups = new Map<string, Omit<CultureDestinationGroup, "share">>();

  cultureRows.forEach((row) => {
    const station = row.currentStation?.trim() || "Станция не указана";
    const recipient = row.recipient?.trim() || "Получатель не указан";
    const key = `${station}\u0000${recipient}`;
    const current = groups.get(key) ?? {
      station,
      recipient,
      wagons: 0,
      tons: 0,
      wagonNumbers: [],
    };

    current.wagons += 1;
    current.tons += row.tons || 0;
    current.wagonNumbers.push(row.wagonNumber);
    groups.set(key, current);
  });

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      wagonNumbers: group.wagonNumbers.sort((left, right) =>
        left.localeCompare(right, "ru", { numeric: true }),
      ),
      share: totalTons ? (group.tons / totalTons) * 100 : 0,
    }))
    .sort(
      (left, right) =>
        right.tons - left.tons ||
        right.wagons - left.wagons ||
        left.station.localeCompare(right.station, "ru"),
    );
};
