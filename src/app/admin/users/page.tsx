"use client";

import dynamic from "next/dynamic";

const UsersPage = dynamic(() => import("@/screens/users-page/users-page"), {
  ssr: false,
});

export default function AdminUsersRoute() {
  return <UsersPage />;
}
