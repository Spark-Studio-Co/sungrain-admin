"use client";

import dynamic from "next/dynamic";
import { CrmRouteLoading } from "@/components/ui/crm-route-loading";

const ElevatorsPage = dynamic(
  () => import("@/screens/elevators-page/elevators-page"),
  { ssr: false, loading: CrmRouteLoading },
);

export default function ElevatorsRoute() {
  return <ElevatorsPage />;
}
