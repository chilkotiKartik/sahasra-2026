import React, { createContext, useContext, useState } from 'react';

type Language = 'en' | 'kn';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (enText: string, knText: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>('en');

  const t = (enText: string, knText: string) => (lang === 'kn' ? knText : enText);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
