"use client";

import NextLink from "next/link";
import { useParams as useNextParams, useRouter } from "next/navigation";
import { useEffect, type AnchorHTMLAttributes, type ReactNode } from "react";

interface LinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to?: string;
  href?: string;
  children: ReactNode;
}

export function Link({ to, href, children, ...props }: LinkProps) {
  return (
    <NextLink href={href ?? to ?? "/"} {...props}>
      {children}
    </NextLink>
  );
}

export function useNavigate() {
  const router = useRouter();

  return (to: string | number, options?: { replace?: boolean }) => {
    if (typeof to === "number") {
      if (to === -1) {
        router.back();
        return;
      }

      window.history.go(to);
      return;
    }

    if (options?.replace) {
      router.replace(to);
      return;
    }

    router.push(to);
  };
}

export function useParams() {
  return useNextParams();
}

export function Navigate({
  to,
  replace,
}: {
  to: string;
  replace?: boolean;
}) {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(to, { replace });
  }, [navigate, replace, to]);

  return null;
}

export function BrowserRouter({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function Routes({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function Route() {
  return null;
}
