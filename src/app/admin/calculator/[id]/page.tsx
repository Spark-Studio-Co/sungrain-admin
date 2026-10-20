"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

const CalculatorPage = dynamic(
  () => import("@/screens/calculator-page/calculator-page"),
  { ssr: false },
);

export default function CalculatorDetailRoute() {
  const { id } = useParams<{ id: string }>();
  return <CalculatorPage id={id} />;
}
