import React, { ReactNode } from "react";
import { Link } from "wouter";
import { AnimatedLogo } from "@/components/ui/animated-logo";
import LanguageSwitcher from "@/components/ui/language-switcher";
import { useTranslation } from "react-i18next";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  showLogo?: boolean;
}

export function AuthLayout({ children, title, subtitle, showLogo = true }: AuthLayoutProps) {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side - Form */}
      <div className="flex flex-col w-full md:w-1/2 p-4 sm:p-6 md:p-8 lg:p-12 justify-center">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>
        
        {showLogo && (
          <div className="mb-6 md:mb-8 flex items-center">
            <Link href="/">
              <span className="flex items-center space-x-2 cursor-pointer">
                <AnimatedLogo size="md" />
                <span className="font-heading text-xl font-bold text-primary">
                  {t("app.name")}
                </span>
              </span>
            </Link>
          </div>
        )}
        
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
          {subtitle && <p className="text-gray-500 mt-2">{subtitle}</p>}
        </div>
        
        {children}
      </div>
      
      {/* Right Side - Hero */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white items-center justify-center p-12">
        <div className="max-w-md">
          <h2 className="text-3xl font-bold mb-4">{t("auth.hero.title")}</h2>
          <p className="mb-6">{t("auth.hero.description")}</p>
          <ul className="space-y-2 sm:space-y-3 md:space-y-4">
            <li className="flex items-center">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm sm:text-base">{t("auth.hero.feature1")}</span>
            </li>
            <li className="flex items-center">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm sm:text-base">{t("auth.hero.feature2")}</span>
            </li>
            <li className="flex items-center">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm sm:text-base">{t("auth.hero.feature3")}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}