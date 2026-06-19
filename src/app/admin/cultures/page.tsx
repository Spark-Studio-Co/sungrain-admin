"use client";

import dynamic from "next/dynamic";

const AgricultureManagementPage = dynamic(
  () => import("@/screens/cultrures-page/cultures-page"),
  { ssr: false }
);

export default function AdminCulturesRoute() {
  return <AgricultureManagementPage />;
}
