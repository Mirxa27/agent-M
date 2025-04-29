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
        className="relative flex w-full lg:w-1/2 p-4 sm:p-6 md:p-8 lg:p-12 xl:p-16 bg-gradient-to-b from-background/40 to-background"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <div className="absolute top-4 right-4 z-10">
          <LanguageSwitcher />
        </div>
        <div className="w-full mx-auto relative">
          {showLogo && (
            <motion.div
              className="mb-6 md:mb-8 lg:mb-10 flex items-center"
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
                  <span className="font-heading text-xl md:text-2xl lg:text-3xl font-bold text-primary transition-colors duration-300 group-hover:text-primary/90">
                    {t("app.name")}
                  </span>
                </span>
              </Link>
            </motion.div>
          )}
          <motion.div
            className="mb-6 md:mb-8 lg:mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-gray-500 dark:text-gray-400 mt-2 md:mt-3 text-sm md:text-base lg:text-lg">
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
        className="hidden md:flex w-full lg:w-1/2 bg-auth-gradient text-white items-center justify-center relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Spline 3D Model Background - Using iframe with pointer-events: none */}
        <div className="absolute inset-0 z-0 w-full h-full">
          <iframe
            src="https://my.spline.design/nexbotrobotcharacterconcept-5f03ff963626fbbf4952a35a16e4a4f3/"
            frameBorder="0"
            width="100%"
            height="100%"
            style={{
              pointerEvents: 'none',
              border: 'none',
              background: 'transparent'
            }}
            title="Mirxa AI Robot"
          ></iframe>
        </div>
        
        {/* Dark overlay to ensure text readability */}
        <div className="absolute inset-0 bg-black opacity-40 z-5"></div>

        <motion.div
          className="max-w-md lg:max-w-xl xl:max-w-2xl relative z-10 p-8 lg:p-12 xl:p-16"
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
            className="mb-6 lg:mb-8 text-base lg:text-lg xl:text-xl opacity-90"
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
            <motion.li variants={featureItem} className="flex items-start">
              <div className="rounded-full bg-primary/20 p-1.5 mr-3 mt-0.5">
                <div className="rounded-full bg-white p-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                </div>
              </div>
              <span>{t("auth.hero.feature1")}</span>
            </motion.li>
            <motion.li variants={featureItem} className="flex items-start">
              <div className="rounded-full bg-primary/20 p-1.5 mr-3 mt-0.5">
                <div className="rounded-full bg-white p-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                </div>
              </div>
              <span>{t("auth.hero.feature2")}</span>
            </motion.li>
            <motion.li variants={featureItem} className="flex items-start">
              <div className="rounded-full bg-primary/20 p-1.5 mr-3 mt-0.5">
                <div className="rounded-full bg-white p-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                </div>
              </div>
              <span>{t("auth.hero.feature3")}</span>
            </motion.li>
          </motion.ul>
        </motion.div>
      </motion.div>
    </div>
  );
}