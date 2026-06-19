import { create } from "zustand";

interface CreateDialogState {
  isCreateDialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
}

export const useCreateUserDialogStore = create<CreateDialogState>((set) => ({
  isCreateDialogOpen: false,
  setDialogOpen: (open) => set({ isCreateDialogOpen: open }),
}));
