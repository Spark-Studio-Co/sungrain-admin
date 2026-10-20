"use client";

import dynamic from "next/dynamic";

const CalculatorPage = dynamic(
  () => import("@/screens/calculator-page/calculator-page"),
  { ssr: false },
);

export default function CalculatorRoute() {
  return <CalculatorPage />;
}
