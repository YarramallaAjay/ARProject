import { create } from 'zustand'

export type ThemeKey = 'midnight' | 'sunset' | 'neon' | 'minimal' | 'carbon'

export interface AppState {
  theme: ThemeKey
  setTheme: (t: ThemeKey) => void
  flipTrigger: number
  triggerFlip: () => void
  name: string
  number: string
  setName: (v: string) => void
  setNumber: (v: string) => void
}

export const useApp = create<AppState>()((set) => ({
  theme: 'midnight',
  setTheme: (t: ThemeKey) => set({ theme: t }),
  flipTrigger: 0,
  triggerFlip: () => set((s) => ({ flipTrigger: s.flipTrigger + 1 })),
  name: 'JANE DOE',
  number: '4242 4242 4242 4242',
  setName: (v: string) => set({ name: v.toUpperCase() }),
  setNumber: (v: string) => set({ number: v }),
})) 