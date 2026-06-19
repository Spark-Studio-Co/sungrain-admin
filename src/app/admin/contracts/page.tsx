"use client";

import dynamic from "next/dynamic";

const ContractsPage = dynamic(() => import("@/screens/contracts-page/contracts-page"), {
  ssr: false,
});

export default function AdminContractsRoute() {
  return <ContractsPage />;
}
