"use client";

import dynamic from "next/dynamic";
import { CrmRouteLoading } from "@/components/ui/crm-route-loading";

const UserContractsPage = dynamic(
  () => import("@/screens/contracts-user-page/contracts-user-page"),
  { ssr: false, loading: CrmRouteLoading }
);

export default function UserContractsRoute() {
  return <UserContractsPage />;
}
