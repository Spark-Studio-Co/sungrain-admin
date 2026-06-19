"use client";

import dynamic from "next/dynamic";

const SenderPage = dynamic(() => import("@/screens/sender-page/sender-page"), {
  ssr: false,
});

export default function AdminSenderRoute() {
  return <SenderPage />;
}
