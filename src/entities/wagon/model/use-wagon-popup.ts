import { create } from "zustand";

interface WagonState {
  isAddDialogOpen: boolean;

  setIsAddDialogOpen: (open: boolean) => void;
}

export const useWagonStore = create<WagonState>((set) => ({
  isAddDialogOpen: false,
  newWagon: { number: "", capacity: "", owner: "" },
  setIsAddDialogOpen: (open) => set({ isAddDialogOpen: open }),
}));
