"use client";

import dynamic from "next/dynamic";
import { CrmRouteLoading } from "@/components/ui/crm-route-loading";

const DashboardPage = dynamic(
  () => import("@/screens/dashboard-page/dashboard-page"),
  { ssr: false, loading: CrmRouteLoading }
);

export default function AdminDashboardRoute() {
  return <DashboardPage />;
}
