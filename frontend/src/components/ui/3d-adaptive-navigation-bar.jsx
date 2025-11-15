import React, { useState, useRef, useEffect } from 'react'
import { motion, useSpring, AnimatePresence } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { createPageUrl } from '@/utils'

/**
 * 3D Adaptive Navigation Pill
 * Smart navigation with hover expansion - Dark Theme
 */
export const PillBase = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const containerRef = useRef(null)
  const hoverTimeoutRef = useRef(null)
  
  // Map routes to section IDs
  const routeToId = {
    '/': 'home',
    '/home': 'home',
    '/analysis': 'analysis',
    '/how-it-works': 'how-it-works',
    '/safety': 'safety',
  }
  
  const [activeSection, setActiveSection] = useState(routeToId[location.pathname] || 'home')

  const navItems = [
    { label: 'Home', id: 'home', path: createPageUrl('Home') },
    { label: 'How It Works', id: 'how-it-works', path: createPageUrl('HowItWorks') },
    { label: 'Safety', id: 'safety', path: createPageUrl('Safety') },
    { label: 'Analyze', id: 'analysis', path: createPageUrl('Analysis') },
  ]

  // Update active section when route changes
  useEffect(() => {
    const sectionId = routeToId[location.pathname] || 'home'
    setActiveSection(sectionId)
  }, [location.pathname])

  // Spring animations for smooth motion
  const pillWidth = useSpring(140, { stiffness: 220, damping: 25, mass: 1 })
  const pillShift = useSpring(0, { stiffness: 220, damping: 25, mass: 1 })

  // Handle hover expansion
  useEffect(() => {
    if (hovering) {
      setExpanded(true)
      pillWidth.set(580)
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    } else {
      hoverTimeoutRef.current = setTimeout(() => {
        setExpanded(false)
        pillWidth.set(140)
      }, 600)
    }

    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [hovering, pillWidth])

  const handleMouseEnter = () => {
    setHovering(true)
  }

  const handleMouseLeave = () => {
    setHovering(false)
  }

  const handleSectionClick = (sectionId, path) => {
    // Trigger transition state
    setIsTransitioning(true)
    setActiveSection(sectionId)
    
    // Navigate to route
    navigate(path)
    
    // Collapse the pill after selection
    setHovering(false)
    
    // Reset transition state after animation completes
    setTimeout(() => {
      setIsTransitioning(false)
    }, 400)
  }

  const activeItem = navItems.find(item => item.id === activeSection)

  // Dark theme colors - black to dark gray gradient
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
  `

  const accentColor = '#ffffff'
  const accentLight = '#f5f5f5'
  const accentDark = '#d4d4d4'

  return (
    <motion.nav
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative rounded-full"
      style={{
        width: pillWidth,
        height: '56px',
        background: darkGradient,
        border: `1px solid rgba(255, 255, 255, 0.2)`,
        boxShadow: expanded
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
          : isTransitioning
          ? `
            0 3px 6px rgba(0, 0, 0, 0.6),
            0 8px 16px rgba(0, 0, 0, 0.4),
            0 16px 32px rgba(0, 0, 0, 0.3),
            0 1px 2px rgba(0, 0, 0, 0.5),
            inset 0 2px 1px rgba(255, 255, 255, 0.2),
            inset 0 -2px 6px rgba(0, 0, 0, 0.4),
            inset 2px 2px 8px rgba(0, 0, 0, 0.3),
            inset -2px 2px 8px rgba(0, 0, 0, 0.25),
            inset 0 0 1px rgba(0, 0, 0, 0.6),
            0 0 15px rgba(255, 255, 255, 0.2)
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
        x: pillShift,
        overflow: 'hidden',
        transition: 'box-shadow 0.3s ease-out',
      }}
    >
      {/* Primary top edge ridge - white glow */}
      <div 
        className="absolute inset-x-0 top-0 rounded-t-full pointer-events-none"
        style={{
          height: '2px',
          background: `linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.6) 5%, rgba(255, 255, 255, 0.8) 15%, rgba(255, 255, 255, 0.8) 85%, rgba(255, 255, 255, 0.6) 95%, rgba(255, 255, 255, 0) 100%)`,
          filter: 'blur(0.5px)',
        }}
      />
      
      {/* Top hemisphere light catch - white */}
      <div 
        className="absolute inset-x-0 top-0 rounded-full pointer-events-none"
        style={{
          height: '55%',
          background: `linear-gradient(180deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 30%, rgba(255, 255, 255, 0.08) 60%, rgba(255, 255, 255, 0) 100%)`,
        }}
      />
      
      {/* Directional light - top left - white */}
      <div 
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: `linear-gradient(135deg, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.12) 20%, rgba(255, 255, 255, 0.05) 40%, rgba(255, 255, 255, 0) 65%)`,
        }}
      />
      
      {/* Premium gloss reflection - main - white tint */}
      <div 
        className="absolute rounded-full pointer-events-none"
        style={{
          left: expanded ? '18%' : '15%',
          top: '16%',
          width: expanded ? '140px' : '60px',
          height: '14px',
          background: `radial-gradient(ellipse at center, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.2) 40%, rgba(255, 255, 255, 0.08) 70%, rgba(255, 255, 255, 0) 100%)`,
          filter: 'blur(4px)',
          transform: 'rotate(-12deg)',
          transition: 'all 0.3s ease',
        }}
      />
      
      {/* Secondary gloss accent - only show when expanded */}
      {expanded && (
        <div 
          className="absolute rounded-full pointer-events-none"
          style={{
            right: '22%',
            top: '20%',
            width: '80px',
            height: '10px',
            background: `radial-gradient(ellipse at center, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.12) 60%, rgba(255, 255, 255, 0) 100%)`,
            filter: 'blur(3px)',
            transform: 'rotate(8deg)',
          }}
        />
      )}
      
      {/* Left edge illumination - only show when expanded */}
      {expanded && (
        <div 
          className="absolute inset-y-0 left-0 rounded-l-full pointer-events-none"
          style={{
            width: '35%',
            background: `linear-gradient(90deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 40%, rgba(255, 255, 255, 0.02) 70%, rgba(255, 255, 255, 0) 100%)`,
          }}
        />
      )}
      
      {/* Right edge shadow - only show when expanded */}
      {expanded && (
        <div 
          className="absolute inset-y-0 right-0 rounded-r-full pointer-events-none"
          style={{
            width: '35%',
            background: `linear-gradient(270deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.3) 40%, rgba(0, 0, 0, 0.1) 70%, rgba(0, 0, 0, 0) 100%)`,
          }}
        />
      )}
      
      {/* Bottom curvature - deep shadow */}
      <div 
        className="absolute inset-x-0 bottom-0 rounded-b-full pointer-events-none"
        style={{
          height: '50%',
          background: `linear-gradient(0deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.4) 25%, rgba(0, 0, 0, 0.15) 50%, rgba(0, 0, 0, 0) 100%)`,
        }}
      />

      {/* Bottom edge contact shadow */}
      <div 
        className="absolute inset-x-0 bottom-0 rounded-b-full pointer-events-none"
        style={{
          height: '20%',
          background: `linear-gradient(0deg, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0) 100%)`,
          filter: 'blur(2px)',
        }}
      />

      {/* Inner diffuse glow - white */}
      <div 
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          boxShadow: `inset 0 0 40px rgba(255, 255, 255, 0.15)`,
          opacity: 0.7,
        }}
      />
      
      {/* Micro edge definition */}
      <div 
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          boxShadow: `inset 0 0 0 0.5px rgba(255, 255, 255, 0.3)`,
        }}
      />

      {/* Navigation items container */}
      <div 
        ref={containerRef}
        className="relative z-10 h-full flex items-center justify-center px-6"
        style={{
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro", Poppins, sans-serif',
        }}
      >
        {/* Collapsed state - show only active section with smooth text transitions */}
        {!expanded && (
          <div className="flex items-center relative">
            <AnimatePresence mode="wait">
              {activeItem && (
                <motion.span
                  key={activeItem.id}
                  initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                  transition={{
                    duration: 0.35,
                    ease: [0.4, 0.0, 0.2, 1]
                  }}
                  style={{
                    fontSize: '15.5px',
                    fontWeight: 680,
                    color: '#ffffff',
                    letterSpacing: '0.45px',
                    whiteSpace: 'nowrap',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", Poppins, sans-serif',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale',
                    textShadow: `
                      0 1px 2px rgba(0, 0, 0, 0.8),
                      0 0 8px rgba(255, 255, 255, 0.6),
                      0 0 16px rgba(255, 255, 255, 0.3)
                    `,
                  }}
                >
                  {activeItem.label}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Expanded state - show all sections with stagger */}
        {expanded && (
          <div className="flex items-center justify-evenly w-full">
            {navItems.map((item, index) => {
              const isActive = item.id === activeSection
              
              return (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ 
                    delay: index * 0.08,
                    duration: 0.25,
                    ease: 'easeOut'
                  }}
                  onClick={() => handleSectionClick(item.id, item.path)}
                  className="relative cursor-pointer transition-all duration-200"
                  style={{
                    fontSize: isActive ? '15.5px' : '15px',
                    fontWeight: isActive ? 680 : 510,
                    color: isActive ? '#ffffff' : '#9ca3af',
                    textDecoration: 'none',
                    letterSpacing: '0.45px',
                    background: 'transparent',
                    border: 'none',
                    padding: '10px 16px',
                    outline: 'none',
                    whiteSpace: 'nowrap',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "SF Pro Display", Poppins, sans-serif',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale',
                    transform: isActive ? 'translateY(-1.5px)' : 'translateY(0)',
                    textShadow: isActive 
                      ? `
                        0 1px 2px rgba(0, 0, 0, 0.8),
                        0 0 8px rgba(255, 255, 255, 0.8),
                        0 0 16px rgba(255, 255, 255, 0.4)
                      `
                      : `
                        0 1px 1px rgba(0, 0, 0, 0.5),
                        0 0 4px rgba(255, 255, 255, 0.3)
                      `,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#d1d5db'
                      e.currentTarget.style.transform = 'translateY(-0.5px)'
                      e.currentTarget.style.textShadow = `
                        0 1px 1px rgba(0, 0, 0, 0.6),
                        0 0 6px rgba(255, 255, 255, 0.5),
                        0 0 12px rgba(255, 255, 255, 0.2)
                      `
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#9ca3af'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.textShadow = `
                        0 1px 1px rgba(0, 0, 0, 0.5),
                        0 0 4px rgba(255, 255, 255, 0.3)
                      `
                    }
                  }}
                >
                  {item.label}
                </motion.button>
              )
            })}
          </div>
        )}
      </div>
    </motion.nav>
  )
}

