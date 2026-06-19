"use client";

import dynamic from "next/dynamic";

const OwnerPage = dynamic(() => import("@/screens/owner-page/owner-page"), {
  ssr: false,
});

export default function AdminOwnerRoute() {
  return <OwnerPage />;
}
