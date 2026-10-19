"use client";
import dynamic from "next/dynamic";
const FarmPage = dynamic(() => import("@/screens/procurement-page/farm-page"), { ssr: false });
export default function NewFarmRoute() { return <FarmPage />; }
