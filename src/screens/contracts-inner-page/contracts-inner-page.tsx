import { ContractInnerBlock } from "./blocks/contract-inner-block";
import { useParams } from "react-router-dom";

export default function ContractsInnerPage() {
  const { id } = useParams();

  return (
    <>
      <ContractInnerBlock contractId={id as any} />
    </>
  );
}
