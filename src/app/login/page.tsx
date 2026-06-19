"use client";

import dynamic from "next/dynamic";

const LoginPage = dynamic(
  () => import("@/screens/login-page/login-page").then((mod) => mod.LoginPage),
  { ssr: false }
);

export default function LoginRoute() {
  return <LoginPage />;
}
