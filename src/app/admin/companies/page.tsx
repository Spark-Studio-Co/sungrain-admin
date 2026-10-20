"use client";

import dynamic from "next/dynamic";
import { CrmRouteLoading } from "@/components/ui/crm-route-loading";

const CompaniesPage = dynamic(
  () => import("@/screens/companies-page/companies-page"),
  { ssr: false, loading: CrmRouteLoading }
);

export default function AdminCompaniesRoute() {
  return <CompaniesPage />;
}
