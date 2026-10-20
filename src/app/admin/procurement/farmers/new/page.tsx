"use client";
import dynamic from "next/dynamic";
import { CrmRouteLoading } from "@/components/ui/crm-route-loading";
const FarmPage = dynamic(() => import("@/screens/procurement-page/farm-page"), { ssr: false, loading: CrmRouteLoading });
export default function NewFarmRoute() { return <FarmPage />; }
