import React, { createContext, useContext, useEffect, useState } from 'react';
import { Language } from '../services/profile.service';
import { TRANSLATIONS, Translations } from '../i18n/translations';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Translations, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'English',
  setLanguage: () => {},
  t: (key) => TRANSLATIONS.English[key] || key,
});

export const LanguageProvider: React.FC<{
  initialLanguage?: Language;
  children: React.ReactNode;
}> = ({ initialLanguage = 'English', children }) => {
  const [language, setLanguage] = useState<Language>(initialLanguage);

  useEffect(() => {
    if (initialLanguage) {
      setLanguage(initialLanguage);
    }
  }, [initialLanguage]);

  const t = (key: keyof Translations, fallback?: string): string => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.English;
    return langDict[key] || TRANSLATIONS.English[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
