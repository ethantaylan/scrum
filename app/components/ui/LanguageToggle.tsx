import { useLanguageStore } from '../../stores/language.store';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguageStore();
  const { i18n } = useTranslation();

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language, i18n]);

  const toggleLanguage = () => {
    const newLanguage = language === 'en' ? 'fr' : 'en';
    setLanguage(newLanguage);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
      aria-label="Toggle language"
    >
      {language === 'en' ? 'EN' : 'FR'}
    </button>
  );
}
