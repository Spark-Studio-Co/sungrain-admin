"use client";

import dynamic from "next/dynamic";

const CalculatorEditor = dynamic(
  () => import("@/screens/calculator-page/calculator-editor"),
  { ssr: false },
);

export default function CalculatorNewRoute() {
  return <CalculatorEditor />;
}
