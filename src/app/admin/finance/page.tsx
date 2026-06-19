"use client";

import dynamic from "next/dynamic";

const FinancesPage = dynamic(() => import("@/screens/finances-page/finances-page"), {
  ssr: false,
});

export default function AdminFinanceRoute() {
  return <FinancesPage />;
}
