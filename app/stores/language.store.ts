import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language, LanguageState } from '../types';

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en' as Language,
      setLanguage: (language: Language) => set({ language }),
    }),
    {
      name: 'language-storage',
    }
  )
);
