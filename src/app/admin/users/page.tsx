"use client";

import dynamic from "next/dynamic";
import { CrmRouteLoading } from "@/components/ui/crm-route-loading";

const UsersPage = dynamic(() => import("@/screens/users-page/users-page"), {
  ssr: false,
  loading: CrmRouteLoading,
});

export default function AdminUsersRoute() {
  return <UsersPage />;
}
