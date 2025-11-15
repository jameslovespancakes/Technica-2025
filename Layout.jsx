import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { SpotlightCursor } from "@/components/ui/spotlight-cursor";
import { PillBase } from "@/components/ui/3d-adaptive-navigation-bar";


export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-black text-white w-full h-full relative">
      {/* Background Beams */}
      <div className="fixed inset-0 z-0">
        <BackgroundBeams className="bg-black" />
      </div>
      <SpotlightCursor config={{ radius: 300, brightness: 0.08, color: '#ffffff' }} />
      <style>{`
        :root {
          --primary-accent: #ffffff;
          --primary-accent-light: #f5f5f5;
          --primary-accent-dark: #d4d4d4;
        }
        
        .glow-effect {
          filter: blur(100px);
          opacity: 0.3;
        }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        .float-animation {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>

      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md">
        <div className="relative w-full px-6 py-4 flex items-center">
          {/* Mobile Navigation - CTA Button - Top Right */}
          <div className="ml-auto md:hidden z-10">
              <Link to={createPageUrl("Analysis")}>
              <Button className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2">
                Analyze
                </Button>
              </Link>
            </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex flex-col min-h-screen pt-20 relative">
        {/* 3D Navigation Pill - Static position on each page */}
        <div className="absolute left-1/2 transform -translate-x-1/2 top-20 md:top-28 hidden md:flex z-40 w-full pointer-events-none">
          <div className="relative w-full flex justify-center">
            <div className="pointer-events-auto">
              <PillBase />
            </div>
          </div>
        </div>

      {/* Main Content */}
        <main className="flex-1">
        {children}
      </main>
      </div>
    </div>
  );
}
