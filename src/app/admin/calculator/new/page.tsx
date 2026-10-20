"use client";

import dynamic from "next/dynamic";
import { CrmRouteLoading } from "@/components/ui/crm-route-loading";

const CalculatorEditor = dynamic(
  () => import("@/screens/calculator-page/calculator-editor"),
  { ssr: false, loading: CrmRouteLoading },
);

export default function CalculatorNewRoute() {
  return <CalculatorEditor />;
}
