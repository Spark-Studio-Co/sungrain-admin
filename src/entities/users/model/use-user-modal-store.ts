import { create } from "zustand";

interface User {
  username: string;
  name: string;
  email: string;
  password: string;
  role: string;
}

interface UserStore {
  isAddDialogOpen: boolean;
  setIsAddDialogOpen: (isOpen: boolean) => void;
  newUser: User;
  setNewUser: (userData: User) => void;
  addNewUser: () => void;
}

const useUserStore = create<UserStore>((set, get) => ({
  isAddDialogOpen: false,
  setIsAddDialogOpen: (isOpen) => set({ isAddDialogOpen: isOpen }),

  newUser: {
    username: "",
    name: "",
    email: "",
    password: "",
    role: "",
  },
  setNewUser: (userData) => set({ newUser: userData }),

  addNewUser: () => {
    console.log("Добавление пользователя:", get().newUser);
    set({
      newUser: { username: "", name: "", email: "", password: "", role: "" },
      isAddDialogOpen: false,
    });
  },
}));

export default useUserStore;
