import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function AnimatedLogo({ size = 'md', className = '' }: AnimatedLogoProps) {
  // Define size variants
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const sizeClass = sizes[size];

  // Animation variants
  const logoVariants = {
    hidden: { opacity: 0.7, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 1.5,
        yoyo: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const starVariants = {
    dim: { 
      opacity: 0.4,
      scale: 0.8
    },
    bright: { 
      opacity: 1,
      scale: 1.2,
      transition: { 
        duration: 1,
        yoyo: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (custom: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { 
          delay: custom * 0.2,
          duration: 1.5, 
          ease: "easeInOut" 
        },
        opacity: { 
          delay: custom * 0.2,
          duration: 0.5 
        }
      }
    })
  };

  return (
    <motion.div 
      className={`${sizeClass} ${className}`}
      initial="hidden"
      animate="visible"
      variants={logoVariants}
    >
      <svg width="100%" height="100%" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g filter="url(#filter0_d)">
          <motion.path 
            d="M120 160L180 100V240L120 300V160Z" 
            stroke="#00C2FF" 
            strokeWidth="8" 
            fill="url(#gradient1)"
            initial="hidden"
            animate="visible"
            custom={0}
            variants={pathVariants}
          />
          <motion.path 
            d="M180 100L240 160V300L180 240V100Z" 
            stroke="#00C2FF" 
            strokeWidth="8" 
            fill="url(#gradient2)"
            initial="hidden"
            animate="visible"
            custom={1}
            variants={pathVariants}
          />
          <motion.path 
            d="M240 160L300 100V240L240 300V160Z" 
            stroke="#00C2FF" 
            strokeWidth="8" 
            fill="url(#gradient3)"
            initial="hidden"
            animate="visible"
            custom={2}
            variants={pathVariants}
          />
          <motion.path 
            d="M300 100L360 160V300L300 240V100Z" 
            stroke="#00C2FF" 
            strokeWidth="8" 
            fill="url(#gradient4)"
            initial="hidden"
            animate="visible"
            custom={3}
            variants={pathVariants}
          />
          
          {/* Star/sparkle in the corner */}
          <motion.path 
            d="M360 100L370 80L380 100L400 110L380 120L370 140L360 120L340 110L360 100Z" 
            fill="#00C2FF"
            initial="dim"
            animate="bright"
            variants={starVariants}
          />
        </g>
        <defs>
          <filter id="filter0_d" x="0" y="0" width="512" height="512" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
            <feFlood floodOpacity="0" result="BackgroundImageFix"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"/>
            <feOffset dy="4"/>
            <feGaussianBlur stdDeviation="15"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0.76 0 0 0 0 1 0 0 0 0.7 0"/>
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
          </filter>
          <linearGradient id="gradient1" x1="120" y1="160" x2="180" y2="240" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00C2FF" stopOpacity="0.5"/>
            <stop offset="100%" stopColor="#0080FF" stopOpacity="0.7"/>
          </linearGradient>
          <linearGradient id="gradient2" x1="180" y1="100" x2="240" y2="240" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00C2FF" stopOpacity="0.5"/>
            <stop offset="100%" stopColor="#0080FF" stopOpacity="0.7"/>
          </linearGradient>
          <linearGradient id="gradient3" x1="240" y1="160" x2="300" y2="240" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00C2FF" stopOpacity="0.5"/>
            <stop offset="100%" stopColor="#0080FF" stopOpacity="0.7"/>
          </linearGradient>
          <linearGradient id="gradient4" x1="300" y1="100" x2="360" y2="240" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00C2FF" stopOpacity="0.5"/>
            <stop offset="100%" stopColor="#0080FF" stopOpacity="0.7"/>
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  );
}