"use client";

import dynamic from "next/dynamic";
import { CrmRouteLoading } from "@/components/ui/crm-route-loading";

const OwnerPage = dynamic(() => import("@/screens/owner-page/owner-page"), {
  ssr: false,
  loading: CrmRouteLoading,
});

export default function AdminOwnerRoute() {
  return <OwnerPage />;
}
