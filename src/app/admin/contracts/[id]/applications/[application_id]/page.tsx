"use client";

import dynamic from "next/dynamic";

const ApplicationPage = dynamic(
  () => import("@/screens/application-page/application-page"),
  { ssr: false }
);

export default function AdminApplicationRoute() {
  return <ApplicationPage />;
}
