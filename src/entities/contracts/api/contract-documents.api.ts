import { apiClient } from "@/shared/api/apiClient";
import type {
  ContractDocument,
  ContractDocumentType,
} from "../model/contract-documents";
import { validateContractDocumentFiles } from "../model/contract-documents";

export async function uploadContractDocuments({
  contractId,
  documents,
}: {
  contractId: string;
  documents: { file: File; name: string; type: ContractDocumentType }[];
}) {
  const error = validateContractDocumentFiles(
    documents.map((document) => document.file),
  );
  if (error) throw new Error(error);
  const body = new FormData();
  documents.forEach(({ file }) => body.append("files", file));
  body.append(
    "files_info",
    JSON.stringify(
      documents.map(({ file, name, type }) => ({
        name: name.trim() || file.name,
        document_type: type,
        status: "-",
        price: 0,
        volume: 0,
        currency: "USD",
      })),
    ),
  );
  const response = await apiClient.post(
    `/contract/upload-files/${contractId}`,
    body,
  );
  return response.data;
}

export async function deleteContractDocument({
  contractId,
  document,
}: {
  contractId: string;
  document: ContractDocument;
}) {
  if (!document.location)
    throw new Error("Не удалось определить файл документа");
  const response = await apiClient.patch(
    `/contract/delete-files/${contractId}`,
    {
      files_info: [{ location: document.location, name: document.name }],
    },
  );
  return response.data;
}
