"use client";

import dynamic from "next/dynamic";

const DashboardPage = dynamic(
  () => import("@/screens/dashboard-page/dashboard-page"),
  { ssr: false }
);

export default function AdminDashboardRoute() {
  return <DashboardPage />;
}
