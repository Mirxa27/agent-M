
import React, { ReactNode, useState, useEffect } from "react";
import { Link } from "wouter";
import { AnimatedLogo } from "@/components/ui/animated-logo";
import LanguageSwitcher from "@/components/ui/language-switcher";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

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
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200,
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const staggerFeatures = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const featureItem = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Left Side - Form */}
      <motion.div 
        className="relative flex flex-col w-full md:w-3/5 p-4 sm:p-6 md:p-8 lg:p-16 xl:p-20 justify-center bg-gradient-to-b from-background/40 to-background"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <div className="absolute top-4 right-4 z-10">
          <LanguageSwitcher />
        </div>
        <div className="w-full max-w-md mx-auto md:mx-0 relative">
          {showLogo && (
            <motion.div 
              className="mb-8 md:mb-10 lg:mb-12 flex items-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <Link href="/">
                <span className="flex items-center space-x-2 sm:space-x-3 cursor-pointer group">
                  <span className="transform transition-transform group-hover:scale-105">
                    <AnimatedLogo
                      size={
                        windowWidth > 1400
                          ? "lg"
                          : windowWidth > 1200
                            ? "md"
                            : "sm"
                      }
                    />
                  </span>
                  <span className="font-heading text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-primary transition-colors duration-300 group-hover:text-primary/90">
                    {t("app.name")}
                  </span>
                </span>
              </Link>
            </motion.div>
          )}
          <motion.div 
            className="mb-8 md:mb-10 lg:mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-gray-500 dark:text-gray-400 mt-3 md:mt-4 text-sm md:text-base lg:text-lg">
                {subtitle}
              </p>
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            {children}
          </motion.div>
        </div>
      </motion.div>

      {/* Right Side - Hero */}
      <motion.div 
        className="hidden md:flex w-2/5 bg-auth-gradient text-white items-center justify-center p-8 xl:p-12 2xl:p-16 relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Background shapes */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white rounded-full blur-3xl opacity-10 translate-y-1/3 -translate-x-1/3"></div>
        </div>
        
        <motion.div 
          className="max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl relative z-10"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <motion.h2 
            className="text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 lg:mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {t("auth.hero.title")}
          </motion.h2>
          <motion.p 
            className="mb-8 lg:mb-10 text-base lg:text-lg xl:text-xl opacity-90"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {t("auth.hero.description")}
          </motion.p>
          <motion.ul 
            className="space-y-4 sm:space-y-5 lg:space-y-6"
            variants={staggerFeatures}
            initial="hidden"
            animate="visible"
          >
            <motion.li className="flex items-center" variants={featureItem}>
              <span className="flex justify-center items-center h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-full bg-primary-900/30 mr-4">
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span className="text-sm sm:text-base lg:text-lg xl:text-xl font-medium">
                {t("auth.hero.feature1")}
              </span>
            </motion.li>
            <motion.li className="flex items-center" variants={featureItem}>
              <span className="flex justify-center items-center h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-full bg-primary-900/30 mr-4">
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span className="text-sm sm:text-base lg:text-lg xl:text-xl font-medium">
                {t("auth.hero.feature2")}
              </span>
            </motion.li>
            <motion.li className="flex items-center" variants={featureItem}>
              <span className="flex justify-center items-center h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 rounded-full bg-primary-900/30 mr-4">
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span className="text-sm sm:text-base lg:text-lg xl:text-xl font-medium">
                {t("auth.hero.feature3")}
              </span>
            </motion.li>
          </motion.ul>
        </motion.div>
      </motion.div>
    </div>
  );
}
