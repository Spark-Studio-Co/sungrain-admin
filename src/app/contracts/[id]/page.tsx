"use client";

import dynamic from "next/dynamic";
import { CrmRouteLoading } from "@/components/ui/crm-route-loading";

const ContractsInnerPage = dynamic(
  () => import("@/screens/contracts-inner-page/contracts-inner-page"),
  { ssr: false, loading: CrmRouteLoading }
);

export default function UserContractInnerRoute() {
  return <ContractsInnerPage />;
}
