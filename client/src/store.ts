import { create } from 'zustand'

export type ThemeKey = 'midnight' | 'sunset' | 'neon' | 'minimal' | 'carbon'

export interface ScannedCard {
  cardNumber?: string
  cardholderName?: string
  bankName?: string
  expiry?: string
  cvv?: string
  otherDetails?: string
  metadata?: Record<string, unknown>
  frontTextureUrl?: string
  backTextureUrl?: string
}

export interface AppState {
  theme: ThemeKey
  setTheme: (t: ThemeKey) => void
  flipTrigger: number
  triggerFlip: () => void
  name: string
  number: string
  setName: (v: string) => void
  setNumber: (v: string) => void
  // scanning
  scanned?: ScannedCard
  setScanned: (s: ScannedCard) => void
  frontTextureUrl?: string
  backTextureUrl?: string
  setFrontTextureUrl: (u?: string) => void
  setBackTextureUrl: (u?: string) => void
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
  scanned: undefined,
  setScanned: (s) => set({ scanned: s }),
  frontTextureUrl: undefined,
  backTextureUrl: undefined,
  setFrontTextureUrl: (u) => set({ frontTextureUrl: u }),
  setBackTextureUrl: (u) => set({ backTextureUrl: u }),
})) 