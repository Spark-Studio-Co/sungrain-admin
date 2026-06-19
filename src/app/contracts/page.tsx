"use client";

import dynamic from "next/dynamic";

const UserContractsPage = dynamic(
  () => import("@/screens/contracts-user-page/contracts-user-page"),
  { ssr: false }
);

export default function UserContractsRoute() {
  return <UserContractsPage />;
}
