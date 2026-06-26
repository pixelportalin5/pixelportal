import { create } from 'zustand';

export const useStore = create((set) => ({
  focused: null, // planet id (0-7), 'sun', or null
  hovered: null, // planet id or null
  setFocused: (id) => set({ focused: id }),
  setHovered: (id) => set({ hovered: id }),
}));