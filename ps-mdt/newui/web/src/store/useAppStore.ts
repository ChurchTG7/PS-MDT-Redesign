import create from 'zustand'
import type { OfficerData } from '../utils/nui'

type AppState = {
  ready: boolean
  setReady: (v: boolean) => void
  officer: OfficerData | null
  setOfficer: (o: OfficerData | null) => void
  canAccessChief: boolean
  setCanAccessChief: (v: boolean) => void
  // Navigation context - allows passing data when navigating between pages
  navigationContext: {
    profileSearch?: string // citizenid to auto-search in profile page
    vehicleSearch?: string // plate to auto-search in DMV page
  } | null
  setNavigationContext: (ctx: AppState['navigationContext']) => void
  clearNavigationContext: () => void
  // Theme customization
  theme: {
    primaryColor: string
    secondaryColor: string
    accentColor: string
    buttonHighlight: string
    iconColor: string
    borderColor: string
    departmentName: string
    departmentSubtitle: string
    logoType: 'icon' | 'image'
    logoIcon: string
    logoImage: string | null
  }
  setTheme: (theme: Partial<AppState['theme']>) => void
}

export const useAppStore = create<AppState>((set) => ({
  ready: false,
  setReady: (v) => set({ ready: v }),
  officer: null,
  setOfficer: (o) => set({ officer: o }),
  canAccessChief: false,
  setCanAccessChief: (v) => set({ canAccessChief: v }),
  navigationContext: null,
  setNavigationContext: (ctx) => set({ navigationContext: ctx }),
  clearNavigationContext: () => set({ navigationContext: null }),
  theme: {
    primaryColor: '#3b82f6',
    secondaryColor: '#1e40af',
    accentColor: '#38bdf8',
    buttonHighlight: '#38bdf8',
    iconColor: '#38bdf8',
    borderColor: '#2448b0',
    departmentName: 'Project Sloth',
    departmentSubtitle: 'Mobile Data Terminal',
    logoType: 'icon',
    logoIcon: 'fa-shield-halved',
    logoImage: null,
  },
  setTheme: (newTheme) => set((state) => ({ theme: { ...state.theme, ...newTheme } })),
}))
