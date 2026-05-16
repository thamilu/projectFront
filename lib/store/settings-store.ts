import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SettingsState } from '@/types/settings';

const defaultSettings: SettingsState = {
  theme: 'system',
  language: 'en',
  currency: 'INR',
  fontSize: 16,
  notifications: {
    email: true,
    push: true,
    sms: false,
    deals: true,
    orders: true,
    newsletter: false,
  },
  accessibility: {
    reduceMotion: false,
    highContrast: false,
    largeText: false,
  },
  display: {
    compactMode: false,
    showPrices: true,
    showRatings: true,
    gridColumns: 5,
  },
  sound: true,
  autoplay: true,
  accentColor: 'blue',
};

interface SettingsStore extends SettingsState {
  sidebarOpen: boolean;
  activeTab: string;
  setSidebarOpen: (open: boolean) => void;
  setActiveTab: (tab: string) => void;
  updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  updateNestedSetting: (path: string, value: unknown) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, _get) => ({
      ...defaultSettings,
      sidebarOpen: false,
      activeTab: 'appearance',

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      setActiveTab: (tab) => set({ activeTab: tab }),

      updateSetting: (key, value) => set({ [key]: value }),

      updateNestedSetting: (path, value) => {
        const keys = path.split('.');
        set((state) => {
          const newState = { ...state };
          let current: unknown = newState;
          
          for (let i = 0; i < keys.length - 1; i++) {
            const existing = (current as Record<string, unknown>)[keys[i]];
            const cloned = (typeof existing === 'object' && existing !== null) ? { ...(existing as Record<string, unknown>) } : {};
            (current as Record<string, unknown>)[keys[i]] = cloned as unknown;
            current = (current as Record<string, unknown>)[keys[i]];
          }

          (current as Record<string, unknown>)[keys[keys.length - 1]] = value as unknown;
          return newState;
        });
      },

      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'eshop-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        currency: state.currency,
        fontSize: state.fontSize,
        notifications: state.notifications,
        accessibility: state.accessibility,
        display: state.display,
        sound: state.sound,
        autoplay: state.autoplay,
        accentColor: state.accentColor,
      }),
    }
  )
);
