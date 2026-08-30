"use client";

import dynamic from "next/dynamic";

const WagonMapPage = dynamic(
  () => import("@/screens/wagon-map-page/wagon-map-page"),
  { ssr: false },
);

export default function AdminWagonMapRoute() {
  return <WagonMapPage />;
}
