import { getOwners } from "@/entities/owner/api/get/get-owners.api";

export async function getWagonOwnerNames(): Promise<string[]> {
  const names = new Set<string>();
  let page = 1;
  let lastPage = 1;
  do {
    const response = await getOwners({ page, limit: 100 });
    for (const item of response.data) {
      if (typeof item.owner === "string" && item.owner.trim()) {
        names.add(item.owner.trim());
      }
    }
    lastPage = response.lastPage;
    page += 1;
  } while (page <= lastPage);
  return [...names];
}
