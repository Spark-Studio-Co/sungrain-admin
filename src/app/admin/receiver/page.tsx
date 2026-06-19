"use client";

import dynamic from "next/dynamic";

const ReceiverPage = dynamic(() => import("@/screens/receiver-page/receiver-page"), {
  ssr: false,
});

export default function AdminReceiverRoute() {
  return <ReceiverPage />;
}
