"use client";

import dynamic from "next/dynamic";

const ProcurementPage = dynamic(
  () => import("@/screens/procurement-page/purchases-page"),
  { ssr: false },
);

export default function AdminProcurementRoute() {
  return <ProcurementPage />;
}
