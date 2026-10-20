"use client";
import dynamic from "next/dynamic";
import { CrmRouteLoading } from "@/components/ui/crm-route-loading";
const PurchaseEditor = dynamic(
  () => import("@/screens/procurement-page/purchase-editor"),
  { ssr: false, loading: CrmRouteLoading },
);
export default function PurchaseRoute() {
  return <PurchaseEditor />;
}
