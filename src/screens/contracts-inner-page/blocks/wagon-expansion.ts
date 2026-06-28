type VisibleWagonGroup = {
  application?: {
    id?: unknown;
  };
  wagons?: any[];
};

export const getVisibleApplicationIds = (groups: VisibleWagonGroup[]) =>
  groups
    .map((group) => group.application?.id)
    .filter((id) => id !== null && id !== undefined && id !== "")
    .map(String);

export const getWagonExpansionId = (wagon: any) =>
  String(
    wagon?.id ??
      wagon?.wagon_id ??
      wagon?.wagon?.id ??
      wagon?.number ??
      ""
  );

export const getVisibleWagonExpansionState = (groups: VisibleWagonGroup[]) =>
  groups.reduce<Record<string, boolean>>((acc, group) => {
    group.wagons?.forEach((wagon) => {
      const wagonId = getWagonExpansionId(wagon);

      if (wagonId) {
        acc[wagonId] = true;
      }
    });

    return acc;
  }, {});

export const areAllVisibleWagonGroupsExpanded = (
  groups: VisibleWagonGroup[],
  expandedRows: Record<string, boolean>,
  expandedApplicationIds: string[]
) => {
  const applicationIds = getVisibleApplicationIds(groups);
  const wagonExpansionState = getVisibleWagonExpansionState(groups);
  const wagonIds = Object.keys(wagonExpansionState);
  const expandedApplications = new Set(expandedApplicationIds.map(String));

  return (
    applicationIds.length > 0 &&
    wagonIds.length > 0 &&
    applicationIds.every((id) => expandedApplications.has(id)) &&
    wagonIds.every((id) => expandedRows[id])
  );
};
