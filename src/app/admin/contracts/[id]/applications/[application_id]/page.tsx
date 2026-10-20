"use client";

import dynamic from "next/dynamic";
import { CrmRouteLoading } from "@/components/ui/crm-route-loading";

const ApplicationPage = dynamic(
  () => import("@/screens/application-page/application-page"),
  { ssr: false, loading: CrmRouteLoading }
);

export default function AdminApplicationRoute() {
  return <ApplicationPage />;
}
