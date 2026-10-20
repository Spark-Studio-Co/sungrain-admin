"use client";

import dynamic from "next/dynamic";
import { CrmRouteLoading } from "@/components/ui/crm-route-loading";

const ProcurementPage = dynamic(
  () => import("@/screens/procurement-page/purchases-page"),
  { ssr: false, loading: CrmRouteLoading },
);

export default function AdminProcurementRoute() {
  return <ProcurementPage />;
}
