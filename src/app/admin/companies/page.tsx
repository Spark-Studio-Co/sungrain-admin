"use client";

import dynamic from "next/dynamic";

const CompaniesPage = dynamic(
  () => import("@/screens/companies-page/companies-page"),
  { ssr: false }
);

export default function AdminCompaniesRoute() {
  return <CompaniesPage />;
}
