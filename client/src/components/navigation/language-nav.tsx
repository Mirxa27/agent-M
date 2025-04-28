import React from 'react';
import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/ui/language-switcher';

export function LanguageNav() {
  const { t } = useTranslation();
  
  return (
    <div className="bg-white dark:bg-gray-900 py-2 px-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
      {/* Logo (in large screens) */}
      <div className="hidden md:flex items-center space-x-2">
        <Link href="/">
          <div className="flex items-center space-x-2 cursor-pointer">
            <img 
              src="/assets/images/mirxa-logo.svg" 
              alt="Mirxa Logo" 
              className="h-8 w-8"
            />
            <span className="text-lg font-semibold text-primary">
              {t('app.name')}
            </span>
          </div>
        </Link>
      </div>
      
      {/* Language switcher */}
      <LanguageSwitcher />
      
      {/* Logo (in small screens) */}
      <div className="md:hidden">
        <Link href="/">
          <div className="flex items-center space-x-2">
            <img 
              src="/assets/images/mirxa-logo.svg" 
              alt="Mirxa Logo" 
              className="h-8 w-8"
            />
          </div>
        </Link>
      </div>
    </div>
  );
}