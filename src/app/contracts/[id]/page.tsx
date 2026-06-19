"use client";

import dynamic from "next/dynamic";

const ContractsInnerPage = dynamic(
  () => import("@/screens/contracts-inner-page/contracts-inner-page"),
  { ssr: false }
);

export default function UserContractInnerRoute() {
  return <ContractsInnerPage />;
}
