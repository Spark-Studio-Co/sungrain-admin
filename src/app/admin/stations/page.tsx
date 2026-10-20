"use client";

import dynamic from "next/dynamic";
import { CrmRouteLoading } from "@/components/ui/crm-route-loading";

const StationsPage = dynamic(() => import("@/screens/stations-page/stations-page"), {
  ssr: false,
  loading: CrmRouteLoading,
});

export default function AdminStationsRoute() {
  return <StationsPage />;
}
