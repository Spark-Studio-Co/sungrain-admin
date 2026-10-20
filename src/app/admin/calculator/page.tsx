"use client";

import dynamic from "next/dynamic";
import { CrmRouteLoading } from "@/components/ui/crm-route-loading";

const CalculatorPage = dynamic(
  () => import("@/screens/calculator-page/calculator-page"),
  { ssr: false, loading: CrmRouteLoading },
);

export default function CalculatorRoute() {
  return <CalculatorPage />;
}
