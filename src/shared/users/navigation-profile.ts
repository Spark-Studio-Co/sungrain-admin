// Navigation preferences only. Server-side permissions remain unchanged.
const accountingNavigationUserIds = new Set([3]);
const accountingNavigationPaths = new Set([
  "/admin/contracts",
  "/admin/finance",
  "/admin/procurement",
]);

export function usesAccountingNavigation(token: string | null | undefined): boolean {
  if (!token || token.length > 8192) return false;
  try {
    const encoded = token.split(".")[1];
    if (!encoded) return false;
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const claims: unknown = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")));
    if (!claims || typeof claims !== "object" || !("id" in claims)) return false;
    const id = (claims as { id: unknown }).id;
    return (typeof id === "number" || (typeof id === "string" && /^\d+$/.test(id))) &&
      accountingNavigationUserIds.has(Number(id));
  } catch {
    return false;
  }
}

export function accountingNavigationIncludes(path: string): boolean {
  return accountingNavigationPaths.has(path);
}
