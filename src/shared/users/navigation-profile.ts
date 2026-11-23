// Navigation preferences only. Server-side permissions remain unchanged.
const accountingNavigationUserIds = new Set([3]);
const accountingNavigationPaths = new Set([
  "/admin/contracts",
  "/admin/procurement",
]);

export function getTokenUserId(token: string | null | undefined): number | null {
  if (!token || token.length > 8192) return null;
  try {
    const encoded = token.split(".")[1];
    if (!encoded) return null;
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const claims: unknown = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")));
    if (!claims || typeof claims !== "object" || !("id" in claims)) return null;
    const id = (claims as { id: unknown }).id;
    const number = typeof id === "number" || (typeof id === "string" && /^\d+$/.test(id))
      ? Number(id)
      : NaN;
    return Number.isSafeInteger(number) && number > 0 ? number : null;
  } catch {
    return null;
  }
}

export function usesAccountingNavigation(token: string | null | undefined): boolean {
  const userId = getTokenUserId(token);
  return userId !== null && accountingNavigationUserIds.has(userId);
}

export function accountingNavigationIncludes(path: string): boolean {
  return accountingNavigationPaths.has(path);
}
