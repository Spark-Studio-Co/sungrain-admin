"use client";

import type { ReactNode } from "react";
import { useTokenExpiration } from "@/hooks/use-token-expiration";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // This hook will handle token expiration
  useTokenExpiration();

  return <>{children}</>;
}
