export type AdminStatus = boolean | null;

interface AuthRedirectInput {
  pathname: string;
  hasToken: boolean;
  isAdmin: AdminStatus;
  isAuthHydrated?: boolean;
  bypassGuestAccess?: boolean;
}

export function getAuthRedirect({
  pathname,
  hasToken,
  isAdmin,
  isAuthHydrated = true,
  bypassGuestAccess = false,
}: AuthRedirectInput): string | null {
  if (!isAuthHydrated) {
    return null;
  }

  const isLogin = pathname === "/login";
  const isRoot = pathname === "/";
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isUserContractsRoute =
    pathname === "/contracts" || pathname.startsWith("/contracts/");

  if (!hasToken) {
    if (bypassGuestAccess) {
      return null;
    }

    return isLogin ? null : "/login";
  }

  if (isAdmin === null) {
    return null;
  }

  if (isAdmin) {
    return isLogin || isRoot ? "/admin" : null;
  }

  if (isLogin || isRoot || isAdminRoute) {
    return "/contracts";
  }

  return isUserContractsRoute ? null : "/contracts";
}
