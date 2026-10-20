"use client";

import dynamic from "next/dynamic";
import { CrmRouteLoading } from "@/components/ui/crm-route-loading";

const WagonMapPage = dynamic(
  () => import("@/screens/wagon-map-page/wagon-map-page"),
  { ssr: false, loading: CrmRouteLoading },
);

export default function AdminWagonMapRoute() {
  return <WagonMapPage />;
}
