import { create } from "zustand";

interface ContractDialogState {
  isAddDialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
}

export const useContractDialogStore = create<ContractDialogState>((set) => ({
  isAddDialogOpen: false,
  setDialogOpen: (open) => set({ isAddDialogOpen: open }),
}));
