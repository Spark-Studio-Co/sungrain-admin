import { create, StoreApi, UseBoundStore } from "zustand";

interface IPopupStore {
    isOpen: boolean
    toggle: () => void
    open: () => void
    close: () => void
}

const popupStorage: Record<string, UseBoundStore<StoreApi<IPopupStore>>> = {};

export const usePopupStore = (storeKey: string) => {
    if (!popupStorage[storeKey]) {
        popupStorage[storeKey] = create<IPopupStore>(
            (set) => ({
                isOpen: false,
                toggle: () => set((state) => ({ isOpen: !state.isOpen })),
                open: () => set({ isOpen: true }),
                close: () => set({ isOpen: false })
            })
        )
    }
    return popupStorage[storeKey]();
}