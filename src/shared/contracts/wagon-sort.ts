export type WagonDateSortOrder = "newest" | "oldest" | null;

const wagonStatusOrder = ["shipped", "in_transit", "at_elevator"];

const getStatusRank = (status: string) => {
  const rank = wagonStatusOrder.indexOf(status);

  return rank === -1 ? wagonStatusOrder.length : rank;
};

const getStatusValue = (value: unknown) =>
  typeof value === "string" ? value.toLowerCase() : "";

const getWagonStatus = (wagon: any) =>
  getStatusValue(wagon?.status || wagon?.wagon?.status);

const resolveWagon = (row: any) => row?.wagon || row;

const parseWagonDate = (value: unknown) => {
  if (!value) return null;

  const date = new Date(String(value));

  return Number.isNaN(date.getTime()) ? null : date;
};

export const getOrderedWagonStatuses = (statuses: string[]) => {
  const uniqueStatuses = Array.from(new Set(statuses.map(getStatusValue).filter(Boolean)));

  return uniqueStatuses.sort((a, b) => {
    const rankDiff = getStatusRank(a) - getStatusRank(b);

    if (rankDiff !== 0) return rankDiff;

    return a.localeCompare(b);
  });
};

export const sortWagonsByStatusGroup = <T>(
  rows: T[],
  dateSortOrder: WagonDateSortOrder = null
) => {
  const effectiveDateSortOrder = dateSortOrder ?? "newest";

  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const wagonA = resolveWagon(a.row);
      const wagonB = resolveWagon(b.row);
      const statusA = getWagonStatus(wagonA);
      const statusB = getWagonStatus(wagonB);
      const rankDiff = getStatusRank(statusA) - getStatusRank(statusB);

      if (rankDiff !== 0) return rankDiff;

      const dateA = parseWagonDate(wagonA?.date_of_unloading);
      const dateB = parseWagonDate(wagonB?.date_of_unloading);

      if (dateA && dateB) {
        const dateDiff = dateA.getTime() - dateB.getTime();

        if (dateDiff !== 0) {
          return effectiveDateSortOrder === "newest" ? -dateDiff : dateDiff;
        }
      }

      if (dateA && !dateB) return -1;
      if (!dateA && dateB) return 1;

      return a.index - b.index;
    })
    .map(({ row }) => row);
};
