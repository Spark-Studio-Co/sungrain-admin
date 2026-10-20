"use client";

import dynamic from "next/dynamic";

const ElevatorsPage = dynamic(
  () => import("@/screens/elevators-page/elevators-page"),
  { ssr: false },
);

export default function ElevatorsRoute() {
  return <ElevatorsPage />;
}
