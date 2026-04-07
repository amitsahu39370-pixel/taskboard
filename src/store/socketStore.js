import { create } from 'zustand';

const useSocketStore = create((set) => ({
  connected: false,
  setConnected: (connected) => set({ connected }),
}));

export default useSocketStore;
