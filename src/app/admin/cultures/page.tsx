"use client";

import dynamic from "next/dynamic";
import { CrmRouteLoading } from "@/components/ui/crm-route-loading";

const AgricultureManagementPage = dynamic(
  () => import("@/screens/cultrures-page/cultures-page"),
  { ssr: false, loading: CrmRouteLoading }
);

export default function AdminCulturesRoute() {
  return <AgricultureManagementPage />;
}
