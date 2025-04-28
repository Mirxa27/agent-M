import React, { ReactNode, useState, useEffect } from "react";
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

export function AuthLayout({
  children,
  title,
  subtitle,
  showLogo = true,
}: AuthLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side - Form */}
      <div className="flex flex-col w-full md:w-3/5 p-4 sm:p-6 md:p-8 lg:p-16 xl:p-20 justify-center">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>

        {showLogo && (
          <div className="mb-6 md:mb-8 lg:mb-10 flex items-center">
            <Link href="/">
              <span className="flex items-center space-x-2 sm:space-x-3 cursor-pointer">
                <AnimatedLogo
                  size={
                    windowWidth > 1400 ? "lg" : windowWidth > 1200 ? "md" : "sm"
                  }
                />
                <span className="font-heading text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-primary">
                  {t("app.name")}
                </span>
              </span>
            </Link>
          </div>
        )}

        <div className="mb-6 md:mb-8 lg:mb-10">
          <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold">
            {title}
          </h1>
          {subtitle && (
            <p className="text-gray-500 dark:text-gray-400 mt-2 md:mt-3 text-sm md:text-base lg:text-lg">
              {subtitle}
            </p>
          )}
        </div>

        {children}
      </div>

      {/* Right Side - Hero */}
      <div className="hidden md:flex w-2/5 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white items-center justify-center p-8 xl:p-12 2xl:p-16">
        <div className="max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl">
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 lg:mb-6">
            {t("auth.hero.title")}
          </h2>
          <p className="mb-6 text-base lg:text-lg xl:text-xl">
            {t("auth.hero.description")}
          </p>
          <ul className="space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-5 xl:space-y-6">
            <li className="flex items-center">
              <svg
                className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 xl:h-7 xl:w-7 mr-2 lg:mr-3 xl:mr-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm sm:text-base lg:text-lg xl:text-xl font-medium">
                {t("auth.hero.feature1")}
              </span>
            </li>
            <li className="flex items-center">
              <svg
                className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 xl:h-7 xl:w-7 mr-2 lg:mr-3 xl:mr-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm sm:text-base lg:text-lg xl:text-xl font-medium">
                {t("auth.hero.feature2")}
              </span>
            </li>
            <li className="flex items-center">
              <svg
                className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 xl:h-7 xl:w-7 mr-2 lg:mr-3 xl:mr-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm sm:text-base lg:text-lg xl:text-xl font-medium">
                {t("auth.hero.feature3")}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
