"use client";

import dynamic from "next/dynamic";

const DislocationsPage = dynamic(
  () => import("@/screens/dislocations-page/dislocations-page"),
  { ssr: false },
);

export default function AdminDislocationsRoute() {
  return <DislocationsPage />;
}
