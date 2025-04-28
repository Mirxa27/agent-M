import React from "react";
import { cn } from "@/lib/utils";
import { VariantProps, cva } from "class-variance-authority";
import { motion } from "framer-motion";

const loaderVariants = cva(
  "flex items-center justify-center relative",
  {
    variants: {
      size: {
        sm: "w-6 h-6",
        md: "w-12 h-12",
        lg: "w-20 h-20",
        xl: "w-32 h-32",
      },
      variant: {
        spinner: "",
        robot: "",
        bot: "",
        brain: "",
        gears: "",
        stars: "",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "spinner",
    },
  }
);

export interface AnimatedLoaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loaderVariants> {
  text?: string;
}

export function AnimatedLoader({
  className,
  size,
  variant,
  text,
  ...props
}: AnimatedLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={cn(loaderVariants({ size, variant }), className)} {...props}>
        {variant === "spinner" && (
          <motion.div
            className="w-full h-full border-4 border-primary/30 border-t-primary rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        )}
        
        {variant === "bot" && (
          <div className="relative">
            <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Robot head base */}
              <motion.rect
                x="25" y="20" width="50" height="50" rx="10"
                className="fill-primary/80"
                initial={{ y: 0 }}
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              
              {/* Eyes */}
              <motion.circle
                cx="40" cy="40" r="6"
                className="fill-background"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
              />
              <motion.circle
                cx="60" cy="40" r="6"
                className="fill-background"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
              
              {/* Smile */}
              <motion.path
                d="M40 55 Q50 65 60 55"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
                animate={{ d: ["M40 55 Q50 65 60 55", "M40 55 Q50 60 60 55", "M40 55 Q50 65 60 55"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              
              {/* Antenna */}
              <motion.line
                x1="50" y1="20" x2="50" y2="10"
                stroke="white"
                strokeWidth="3"
                initial={{ y: 0 }}
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.circle
                cx="50" cy="8" r="3"
                className="fill-primary-foreground"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
              />
            </svg>
          </div>
        )}
        
        {variant === "brain" && (
          <div className="relative">
            <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Brain base */}
              <motion.path
                d="M30 50 C30 35 40 25 50 25 C60 25 70 35 70 50 C70 65 60 75 50 75 C40 75 30 65 30 50 Z"
                className="fill-primary/70 stroke-primary"
                strokeWidth="2"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              
              {/* Brain grooves */}
              <motion.path
                d="M30 50 C40 45 60 45 70 50"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.path
                d="M30 55 C40 60 60 60 70 55"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                animate={{ y: [0, 2, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
              
              {/* Neurons */}
              <motion.circle
                cx="40" cy="40" r="3"
                className="fill-primary-foreground"
                animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
              />
              <motion.circle
                cx="60" cy="40" r="3"
                className="fill-primary-foreground"
                animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
              />
              <motion.circle
                cx="50" cy="65" r="3"
                className="fill-primary-foreground"
                animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              />
            </svg>
          </div>
        )}
        
        {variant === "gears" && (
          <div className="relative">
            <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* First gear */}
              <motion.path
                d="M35 50 L37 40 L33 30 L43 25 L53 30 L55 40 L53 50 L43 55 L35 50 Z"
                className="fill-primary/80 stroke-primary"
                strokeWidth="2"
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                style={{ transformOrigin: "45px 40px" }}
              />
              
              {/* Second gear */}
              <motion.path
                d="M65 60 L67 50 L63 40 L73 35 L83 40 L85 50 L83 60 L73 65 L65 60 Z"
                className="fill-primary/80 stroke-primary"
                strokeWidth="2"
                animate={{ rotate: -360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                style={{ transformOrigin: "75px 50px" }}
              />
              
              {/* Center circles */}
              <circle cx="45" cy="40" r="5" className="fill-background" />
              <circle cx="75" cy="50" r="5" className="fill-background" />
            </svg>
          </div>
        )}
        
        {variant === "stars" && (
          <div className="relative">
            <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Central star */}
              <motion.path
                d="M50 20 L55 35 L70 35 L60 45 L65 60 L50 50 L35 60 L40 45 L30 35 L45 35 L50 20 Z"
                className="fill-primary/80 stroke-primary"
                strokeWidth="2"
                animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                transition={{ 
                  rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
                style={{ transformOrigin: "50px 50px" }}
              />
              
              {/* Small stars */}
              <motion.path
                d="M25 25 L27 30 L32 30 L28 35 L30 40 L25 37 L20 40 L22 35 L18 30 L23 30 L25 25 Z"
                className="fill-primary/60 stroke-primary"
                strokeWidth="1"
                animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }}
                transition={{ 
                  opacity: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
                  scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
              />
              
              <motion.path
                d="M75 75 L77 80 L82 80 L78 85 L80 90 L75 87 L70 90 L72 85 L68 80 L73 80 L75 75 Z"
                className="fill-primary/60 stroke-primary"
                strokeWidth="1"
                animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.2, 1] }}
                transition={{ 
                  opacity: { duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
                  scale: { duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }
                }}
              />
              
              <motion.path
                d="M75 25 L77 30 L82 30 L78 35 L80 40 L75 37 L70 40 L72 35 L68 30 L73 30 L75 25 Z"
                className="fill-primary/60 stroke-primary"
                strokeWidth="1"
                animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.2, 1] }}
                transition={{ 
                  opacity: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 },
                  scale: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }
                }}
              />
            </svg>
          </div>
        )}
      </div>
      {text && <p className="text-center text-sm text-muted-foreground animate-pulse">{text}</p>}
    </div>
  );
}