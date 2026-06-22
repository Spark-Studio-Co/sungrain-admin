"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import reactQueryClient from "@/shared/api/queryClient";
import { useAuthData } from "@/entities/auth/model/use-auth-store";
import { checkIsAdmin } from "@/entities/users/api/get/check-is-admin.api";
import {
  DEV_AUTH_SESSION,
  shouldBypassAuthLocally,
} from "@/shared/auth/dev-session";
import { getAuthRedirect, type AdminStatus } from "@/shared/auth/route-policy";
import { Layout } from "@/shared/ui/layout";
import { ToastProvider } from "@/components/ui/toast";

type PersistApi = {
  persist?: {
    hasHydrated: () => boolean;
    onFinishHydration: (listener: () => void) => () => void;
  };
};

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={reactQueryClient}>
      <ToastProvider>
        <RouteGuard>{children}</RouteGuard>
      </ToastProvider>
    </QueryClientProvider>
  );
}

function RouteGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    token,
    removeToken,
    saveRefreshToken,
    saveRole,
    saveToken,
    saveUserId,
  } = useAuthData();
  const [isAdmin, setIsAdmin] = useState<AdminStatus>(null);
  const [checkedAdmin, setCheckedAdmin] = useState(false);
  const [isAuthHydrated, setIsAuthHydrated] = useState(false);

  const isProtectedRoute =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/contracts" ||
    pathname.startsWith("/contracts/");

  useEffect(() => {
    const persistApi = (useAuthData as typeof useAuthData & PersistApi).persist;

    if (!persistApi) {
      setIsAuthHydrated(true);
      return;
    }

    setIsAuthHydrated(persistApi.hasHydrated());
    return persistApi.onFinishHydration(() => setIsAuthHydrated(true));
  }, []);

  useEffect(() => {
    const tokenReset = sessionStorage.getItem("tokenReset");

    if (!tokenReset && !shouldBypassAuthLocally()) {
      removeToken();
      sessionStorage.setItem("tokenReset", "true");
    }
  }, [removeToken]);

  useEffect(() => {
    if (
      !isAuthHydrated ||
      token ||
      !isProtectedRoute ||
      !shouldBypassAuthLocally()
    ) {
      return;
    }

    saveToken(DEV_AUTH_SESSION.accessToken);
    saveRefreshToken(DEV_AUTH_SESSION.refreshToken);
    saveUserId(DEV_AUTH_SESSION.userId);
    saveRole(DEV_AUTH_SESSION.role);
    localStorage.setItem("id", JSON.stringify(DEV_AUTH_SESSION.uid));
    localStorage.setItem("isAdmin", "true");
    setIsAdmin(true);
    setCheckedAdmin(true);
  }, [
    isAuthHydrated,
    isProtectedRoute,
    saveRefreshToken,
    saveRole,
    saveToken,
    saveUserId,
    token,
  ]);

  useEffect(() => {
    if (!token) {
      setIsAdmin(null);
      setCheckedAdmin(true);
      localStorage.removeItem("isAdmin");
      return;
    }

    let cancelled = false;
    setCheckedAdmin(false);

    checkIsAdmin()
      .then((adminStatus) => {
        if (cancelled) return;
        setIsAdmin(adminStatus);
        localStorage.setItem("isAdmin", JSON.stringify(adminStatus));
      })
      .catch(() => {
        if (cancelled) return;
        setIsAdmin(false);
        localStorage.setItem("isAdmin", "false");
      })
      .finally(() => {
        if (!cancelled) {
          setCheckedAdmin(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!isAuthHydrated) {
      return;
    }

    if (token && !checkedAdmin) {
      return;
    }

    const redirect = getAuthRedirect({
      pathname,
      hasToken: Boolean(token),
      isAdmin: token ? isAdmin : null,
      isAuthHydrated,
      bypassGuestAccess: isProtectedRoute && shouldBypassAuthLocally(),
    });

    if (redirect && redirect !== pathname) {
      router.replace(redirect);
    }
  }, [
    checkedAdmin,
    isAdmin,
    isAuthHydrated,
    isProtectedRoute,
    pathname,
    router,
    token,
  ]);

  const shouldRenderShell = isProtectedRoute;

  if (!isAuthHydrated) {
    return null;
  }

  return shouldRenderShell ? (
    <Layout isAdmin={isAdmin}>{children}</Layout>
  ) : (
    <>{children}</>
  );
}
