"use client";
import dynamic from "next/dynamic";
const PurchaseEditor = dynamic(
  () => import("@/screens/procurement-page/purchase-editor"),
  { ssr: false },
);
export default function NewPurchaseRoute() {
  return <PurchaseEditor />;
}
