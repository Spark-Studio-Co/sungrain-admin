export type AccessOption = {
  value: string;
  label: string;
};

const toId = (value: unknown) => String(value ?? "");

const getContractTitle = (contract: any) =>
  contract?.title || contract?.name || "Без названия";

export const getCompanyOptions = (companies: any[] = []): AccessOption[] =>
  companies
    .map((company) => ({
      value: toId(company?.id),
      label: company?.name || "Компания",
    }))
    .filter((option) => option.value);

export const getContractsForCompanies = (
  contracts: any[] = [],
  companyIds: string[] = []
) => {
  const selectedCompanyIds = new Set(companyIds.map(toId));

  if (selectedCompanyIds.size === 0) {
    return [];
  }

  return contracts.filter((contract) =>
    selectedCompanyIds.has(toId(contract?.companyId))
  );
};

export const getContractOptions = (contracts: any[] = []): AccessOption[] =>
  contracts
    .map((contract) => ({
      value: toId(contract?.id),
      label: `${contract?.number || "Без номера"} - ${getContractTitle(contract)}`,
    }))
    .filter((option) => option.value);

export const pruneContractIdsForCompanies = (
  contractIds: string[] = [],
  contracts: any[] = [],
  companyIds: string[] = []
) => {
  const selectedCompanyIds = new Set(companyIds.map(toId));

  return contractIds.filter((contractId) => {
    const contract = contracts.find(
      (item) => toId(item?.id) === toId(contractId)
    );

    return !contract || selectedCompanyIds.has(toId(contract.companyId));
  });
};
