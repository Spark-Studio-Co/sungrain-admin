"use client";

import dynamic from "next/dynamic";
import { CrmRouteLoading } from "@/components/ui/crm-route-loading";

const SenderPage = dynamic(() => import("@/screens/sender-page/sender-page"), {
  ssr: false,
  loading: CrmRouteLoading,
});

export default function AdminSenderRoute() {
  return <SenderPage />;
}
