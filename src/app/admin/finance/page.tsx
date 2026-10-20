"use client";

import dynamic from "next/dynamic";
import { CrmRouteLoading } from "@/components/ui/crm-route-loading";

const FinancesPage = dynamic(() => import("@/screens/finances-page/finances-page"), {
  ssr: false,
  loading: CrmRouteLoading,
});

export default function AdminFinanceRoute() {
  return <FinancesPage />;
}
