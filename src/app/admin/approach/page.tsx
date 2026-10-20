"use client";

import dynamic from "next/dynamic";
import { CrmRouteLoading } from "@/components/ui/crm-route-loading";

const ApproachPage = dynamic(
  () => import("@/screens/approach-page/approach-page"),
  { ssr: false, loading: CrmRouteLoading },
);

export default function AdminApproachRoute() {
  return <ApproachPage />;
}
