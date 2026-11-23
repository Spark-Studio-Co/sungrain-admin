"use client";

import { useNavigate, useParams } from "react-router-dom";
import { useAuthData } from "@/entities/auth/model/use-auth-store";
import { AddWagonPopup } from "@/entities/wagon/ui/add-wagon-popup";
import { ApplicationDetail } from "./blocks/application-details";

export default function ApplicationDocumentPage() {
  const { id, application_id } = useParams();
  const navigate = useNavigate();
  const isAdmin = useAuthData((state) => state.role === "ADMIN");
  if (typeof id !== "string" || typeof application_id !== "string") return null;
  return (
    <>
      <ApplicationDetail
        applicationId={application_id}
        contractId={id}
        isAdmin={isAdmin}
        onBack={() => navigate(`/admin/contracts/${id}`)}
      />
      {isAdmin && <AddWagonPopup contractId={id} applicationId={application_id} />}
    </>
  );
}
