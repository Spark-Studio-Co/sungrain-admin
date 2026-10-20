"use client";

import dynamic from "next/dynamic";
import { CrmRouteLoading } from "@/components/ui/crm-route-loading";

const DislocationsPage = dynamic(
  () => import("@/screens/dislocations-page/dislocations-page"),
  { ssr: false, loading: CrmRouteLoading },
);

export default function AdminDislocationsRoute() {
  return <DislocationsPage />;
}
