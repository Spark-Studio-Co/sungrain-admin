"use client";

import dynamic from "next/dynamic";

const StationsPage = dynamic(() => import("@/screens/stations-page/stations-page"), {
  ssr: false,
});

export default function AdminStationsRoute() {
  return <StationsPage />;
}
