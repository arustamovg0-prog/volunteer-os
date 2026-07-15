'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import ru from '@/locales/ru.json';
import en from '@/locales/en.json';
import uz from '@/locales/uz.json';

type Locale = 'ru' | 'en' | 'uz';

const translations = { ru, en, uz };

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ru');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('volunteer_os_locale') as Locale;
    if (saved && ['ru', 'en', 'uz'].includes(saved)) {
      setLocaleState(saved);
    }
    setIsMounted(true);
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('volunteer_os_locale', l);
  };

  const t = (path: string): string => {
    const keys = path.split('.');
    let current: any = translations[locale];
    
    for (const key of keys) {
      if (current[key] === undefined) {
        console.warn(`Translation key not found: ${path}`);
        return path;
      }
      current = current[key];
    }
    
    return current;
  };

  if (!isMounted) return null; // prevent hydration mismatch

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}
