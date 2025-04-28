import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { MoonIcon, SunIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import LanguageSwitcher from '@/components/ui/language-switcher';

export function LanguageNav() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  return (
    <div className="fixed top-4 right-4 flex items-center gap-2 z-50">
      {/* Theme toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        aria-label={theme === 'dark' ? t('settings.lightMode') : t('settings.darkMode')}
      >
        {theme === 'dark' ? (
          <SunIcon className="h-5 w-5" />
        ) : (
          <MoonIcon className="h-5 w-5" />
        )}
      </Button>
      
      {/* Language switcher */}
      <LanguageSwitcher />
      
      {/* Logo (in small screens) */}
      <div className="md:hidden">
        <Link href="/">
          <a className="flex items-center space-x-2">
            <img 
              src="/assets/images/mirxa-logo.svg" 
              alt="Mirxa Logo" 
              className="h-8 w-8"
            />
          </a>
        </Link>
      </div>
    </div>
  );
}