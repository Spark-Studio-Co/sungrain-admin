"use client";

import dynamic from "next/dynamic";
import { CrmRouteLoading } from "@/components/ui/crm-route-loading";

const ContractsPage = dynamic(() => import("@/screens/contracts-page/contracts-page"), {
  ssr: false,
  loading: CrmRouteLoading,
});

export default function AdminContractsRoute() {
  return <ContractsPage />;
}
