import { ContractInnerBlock } from "./blocks/contract-inner-block";
import { useParams } from "react-router-dom";

export default function ContractsInnerPage({ clientOnly = false }: { clientOnly?: boolean }) {
  const { id } = useParams();

  return (
    <>
      <ContractInnerBlock contractId={id as any} clientOnly={clientOnly} />
    </>
  );
}
