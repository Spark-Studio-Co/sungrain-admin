"use client";

import dynamic from "next/dynamic";
import { CrmRouteLoading } from "@/components/ui/crm-route-loading";

const ReceiverPage = dynamic(() => import("@/screens/receiver-page/receiver-page"), {
  ssr: false,
  loading: CrmRouteLoading,
});

export default function AdminReceiverRoute() {
  return <ReceiverPage />;
}
