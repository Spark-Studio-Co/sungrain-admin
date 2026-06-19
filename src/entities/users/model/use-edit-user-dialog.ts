import { create } from "zustand";

interface EditDialogState {
  isEditDialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
}

export const useEditUserDialogStore = create<EditDialogState>((set) => ({
  isEditDialogOpen: false,
  setDialogOpen: (open) => set({ isEditDialogOpen: open }),
}));
