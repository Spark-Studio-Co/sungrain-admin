"use client";

import dynamic from "next/dynamic";

const ApproachPage = dynamic(
  () => import("@/screens/approach-page/approach-page"),
  { ssr: false },
);

export default function AdminApproachRoute() {
  return <ApproachPage />;
}
