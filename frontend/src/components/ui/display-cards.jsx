"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

function DisplayCard({
  className,
  icon = <Sparkles className="size-5 text-blue-300" />,
  title = "Featured",
  description = "Discover amazing content",
  date = "Just now",
  iconClassName = "text-blue-500",
  titleClassName = "text-blue-500",
  onClick,
  isActive,
  index,
  baseY = 0,
  baseX = 0,
  activeY = 0,
}) {
  // Dark theme colors - black to dark gray gradient (same as home bubble)
  const darkGradient = `
    linear-gradient(135deg, 
      #1a1a1a 0%, 
      #181818 15%, 
      #161616 30%, 
      #141414 45%, 
      #121212 60%, 
      #101010 75%, 
      #0e0e0e 90%, 
      #000000 100%
    )
  `;

  return (
    <motion.div
      onClick={onClick}
      className={cn(
        "relative flex min-h-[187px] w-[28.6rem] max-w-[28.6rem] select-none flex-col justify-between rounded-xl px-5 py-4 cursor-pointer overflow-hidden",
        isActive && "z-50 grayscale-0 !before:opacity-0",
        !isActive && "grayscale-[100%] before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 before:transition-opacity before:duration-700 before:left-0 before:top-0",
        className
      )}
      animate={{
        y: activeY,
        scale: isActive ? 1.02 : 1,
      }}
      initial={{
        y: baseY,
        scale: 1,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8,
      }}
      style={{
        background: darkGradient,
        border: `1px solid rgba(255, 255, 255, 0.2)`,
        boxShadow: isActive
          ? `
            0 2px 4px rgba(0, 0, 0, 0.8),
            0 6px 12px rgba(0, 0, 0, 0.6),
            0 12px 24px rgba(0, 0, 0, 0.4),
            0 24px 48px rgba(0, 0, 0, 0.2),
            inset 0 2px 2px rgba(255, 255, 255, 0.3),
            inset 0 -3px 8px rgba(0, 0, 0, 0.8),
            inset 3px 3px 8px rgba(0, 0, 0, 0.6),
            inset -3px 3px 8px rgba(0, 0, 0, 0.5),
            inset 0 -1px 2px rgba(0, 0, 0, 0.4),
            0 0 20px rgba(255, 255, 255, 0.3)
          `
          : `
            0 3px 6px rgba(0, 0, 0, 0.7),
            0 8px 16px rgba(0, 0, 0, 0.5),
            0 16px 32px rgba(0, 0, 0, 0.4),
            0 1px 2px rgba(0, 0, 0, 0.6),
            inset 0 2px 1px rgba(255, 255, 255, 0.25),
            inset 0 -2px 6px rgba(0, 0, 0, 0.5),
            inset 2px 2px 8px rgba(0, 0, 0, 0.4),
            inset -2px 2px 8px rgba(0, 0, 0, 0.35),
            inset 0 0 1px rgba(0, 0, 0, 0.7),
            0 0 12px rgba(255, 255, 255, 0.15)
          `,
        transition: 'box-shadow 0.3s ease-out',
      }}
    >
      {/* Primary top edge ridge */}
      <div 
        className="absolute inset-x-0 top-0 rounded-t-xl pointer-events-none"
        style={{
          height: '2px',
          background: `linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.6) 5%, rgba(255, 255, 255, 0.8) 15%, rgba(255, 255, 255, 0.8) 85%, rgba(255, 255, 255, 0.6) 95%, rgba(255, 255, 255, 0) 100%)`,
          filter: 'blur(0.5px)',
        }}
      />
      
      {/* Top hemisphere light catch */}
      <div 
        className="absolute inset-x-0 top-0 rounded-t-xl pointer-events-none"
        style={{
          height: '55%',
          background: `linear-gradient(180deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 30%, rgba(255, 255, 255, 0.08) 60%, rgba(255, 255, 255, 0) 100%)`,
        }}
      />
      
      {/* Directional light - top left */}
      <div 
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          background: `linear-gradient(135deg, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.12) 20%, rgba(255, 255, 255, 0.05) 40%, rgba(255, 255, 255, 0) 65%)`,
        }}
      />
      
      {/* Premium gloss reflection */}
      <div 
        className="absolute rounded-xl pointer-events-none"
        style={{
          left: '18%',
          top: '16%',
          width: '60px',
          height: '14px',
          background: `radial-gradient(ellipse at center, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.2) 40%, rgba(255, 255, 255, 0.08) 70%, rgba(255, 255, 255, 0) 100%)`,
          filter: 'blur(4px)',
          transform: 'rotate(-12deg)',
          transition: 'all 0.3s ease',
        }}
      />
      
      {/* Bottom curvature - deep shadow */}
      <div 
        className="absolute inset-x-0 bottom-0 rounded-b-xl pointer-events-none"
        style={{
          height: '50%',
          background: `linear-gradient(0deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.4) 25%, rgba(0, 0, 0, 0.15) 50%, rgba(0, 0, 0, 0) 100%)`,
        }}
      />

      {/* Bottom edge contact shadow */}
      <div 
        className="absolute inset-x-0 bottom-0 rounded-b-xl pointer-events-none"
        style={{
          height: '20%',
          background: `linear-gradient(0deg, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0) 100%)`,
          filter: 'blur(2px)',
        }}
      />

      {/* Inner diffuse glow */}
      <div 
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          boxShadow: `inset 0 0 40px rgba(255, 255, 255, 0.15)`,
          opacity: 0.7,
        }}
      />
      
      {/* Micro edge definition */}
      <div 
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          boxShadow: `inset 0 0 0 0.5px rgba(255, 255, 255, 0.3)`,
        }}
      />

      {/* Gradient fade overlay for stacked effect */}
      <div className="absolute -right-1 top-[-5%] h-[110%] w-[26rem] bg-gradient-to-l from-background to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between h-full">
        <div className="flex items-start gap-3 flex-shrink-0 min-w-0">
          <span className="relative inline-block rounded-full bg-blue-800 p-1.5 flex-shrink-0">
            {icon}
          </span>
          <p className={cn("text-xl font-medium break-words min-w-0 flex-1", titleClassName)}>{title}</p>
        </div>
        <p className="text-lg break-words line-clamp-2 overflow-hidden text-ellipsis">{description}</p>
        <p className="text-muted-foreground text-base flex-shrink-0">{date}</p>
      </div>
    </motion.div>
  );
}

export default function DisplayCards({ cards }) {
  const [activeIndex, setActiveIndex] = useState(null);

  const defaultCards = [
    {
      className: "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
      className: "[grid-area:stack] translate-x-16 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
      className: "[grid-area:stack] translate-x-32 translate-y-20 hover:translate-y-10",
    },
  ];

  const displayCards = cards || defaultCards;

  const handleCardClick = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  // Helper to extract translate values from className
  const extractTransforms = (className) => {
    const xMatch = className.match(/translate-x-(\d+)/);
    const yMatch = className.match(/translate-y-(\d+)/);
    const x = xMatch ? parseInt(xMatch[1]) * 4 : 0; // Tailwind: translate-x-12 = 48px
    const y = yMatch ? parseInt(yMatch[1]) * 4 : 0; // Tailwind: translate-y-8 = 32px
    return { x, y };
  };

  return (
    <div className="grid [grid-template-areas:'stack'] place-items-center opacity-100 animate-in fade-in-0 duration-700">
      {displayCards.map((cardProps, index) => {
        const isActive = activeIndex === index;
        const baseClass = cardProps.className || "";
        // Remove translate-y classes but keep translate-x for base positioning
        // Motion will handle y smoothly, x can stay in CSS for stability
        const cleanClass = baseClass
          .replace(/translate-y-[\d-]+|translate-y-\[[\d-]+\]/g, "")
          .replace(/hover:translate-y-[\d-]+/g, "");
        
        const { x: baseX, y: baseY } = extractTransforms(baseClass);
        const activeY = isActive ? baseY - 128 : baseY;
        
        return (
          <DisplayCard
            key={index}
            {...cardProps}
            index={index}
            onClick={() => handleCardClick(index)}
            isActive={isActive}
            baseX={baseX}
            baseY={baseY}
            activeY={activeY}
            className={cn(
              "[grid-area:stack]",
              cleanClass
            )}
          />
        );
      })}
    </div>
  );
}

