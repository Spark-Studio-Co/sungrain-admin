"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

const ElevatorsPage = dynamic(
  () => import("@/screens/elevators-page/elevators-page"),
  { ssr: false },
);

export default function ElevatorDetailRoute() {
  const { id } = useParams<{ id: string }>();
  return <ElevatorsPage id={id} />;
}
