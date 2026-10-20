"use client";

import dynamic from "next/dynamic";
import { CrmRouteLoading } from "@/components/ui/crm-route-loading";

const LoginPage = dynamic(
  () => import("@/screens/login-page/login-page").then((mod) => mod.LoginPage),
  { ssr: false, loading: CrmRouteLoading }
);

export default function LoginRoute() {
  return <LoginPage />;
}
