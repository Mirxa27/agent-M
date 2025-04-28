import React from "react";
import { motion } from "framer-motion";
import { AnimatedLoader } from "./animated-loader";
import { cn } from "@/lib/utils";

interface LoadingScreenProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "fullscreen" | "inline";
  loaderVariant?: "spinner" | "bot" | "brain" | "gears" | "stars";
  loaderSize?: "sm" | "md" | "lg" | "xl";
  text?: string;
  showProgress?: boolean;
  progress?: number;
}

export function LoadingScreen({
  variant = "default",
  loaderVariant = "bot",
  loaderSize = "lg",
  text = "Loading...",
  showProgress = false,
  progress = 0,
  className,
  ...props
}: LoadingScreenProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.2,
      },
    },
  };

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  if (variant === "inline") {
    return (
      <div
        className={cn("flex items-center justify-center p-4", className)}
        {...props}
      >
        <AnimatedLoader variant={loaderVariant} size="sm" text={text} />
      </div>
    );
  }

  return (
    <motion.div
      className={cn(
        "flex flex-col items-center justify-center",
        variant === "fullscreen" ? "fixed inset-0 z-50 bg-background" : "h-96",
        className,
      )}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      {...props}
    >
      <AnimatedLoader variant={loaderVariant} size={loaderSize} />

      <motion.div
        className="mt-8 text-center space-y-4"
        variants={textVariants}
      >
        <motion.h2
          className="text-xl font-medium text-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {text}
        </motion.h2>

        {showProgress && (
          <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
