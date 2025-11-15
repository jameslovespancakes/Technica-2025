import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Typewriter } from "@/components/ui/typewriter";

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center px-6 py-20">

      <div className="max-w-5xl mx-auto text-center relative z-10 mt-12">
        {/* Main Heading */}
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          DermaAI is{" "}
          <Typewriter
            text={[
              "accurate",
              "fast",
              "private",
              "accessible",
              "reliable",
              "AI-powered",
              "medical-grade",
            ]}
            speed={70}
            className="text-gray-200"
            waitTime={2000}
            deleteSpeed={40}
            cursorChar="|"
          />
        </h1>

        {/* Subheading */}
        <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto">
          AI powered skin analysis
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to={createPageUrl("Analysis")}>
            <div className="relative rounded-full group">
              <div
                className="relative rounded-full"
                style={{
                  background: `linear-gradient(135deg, 
                    #1a1a1a 0%, 
                    #181818 15%, 
                    #161616 30%, 
                    #141414 45%, 
                    #121212 60%, 
                    #101010 75%, 
                    #0e0e0e 90%, 
                    #000000 100%
                  )`,
                  border: `1px solid rgba(255, 255, 255, 0.2)`,
                  boxShadow: `
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
                  overflow: 'hidden',
                  transition: 'box-shadow 0.3s ease-out',
                  padding: '12px 32px',
                  cursor: 'pointer',
                }}
              >
                {/* Primary top edge ridge */}
                <div 
                  className="absolute inset-x-0 top-0 rounded-t-full pointer-events-none"
                  style={{
                    height: '2px',
                    background: `linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.6) 5%, rgba(255, 255, 255, 0.8) 15%, rgba(255, 255, 255, 0.8) 85%, rgba(255, 255, 255, 0.6) 95%, rgba(255, 255, 255, 0) 100%)`,
                    filter: 'blur(0.5px)',
                  }}
                />
                
                {/* Top hemisphere light catch */}
                <div 
                  className="absolute inset-x-0 top-0 rounded-full pointer-events-none"
                  style={{
                    height: '55%',
                    background: `linear-gradient(180deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 30%, rgba(255, 255, 255, 0.08) 60%, rgba(255, 255, 255, 0) 100%)`,
                  }}
                />
                
                {/* Directional light - top left */}
                <div 
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    background: `linear-gradient(135deg, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.12) 20%, rgba(255, 255, 255, 0.05) 40%, rgba(255, 255, 255, 0) 65%)`,
                  }}
                />
                
                {/* Premium gloss reflection */}
                <div 
                  className="absolute rounded-full pointer-events-none"
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

                {/* Inner diffuse glow */}
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

                {/* Button content */}
                <div className="relative z-10 flex items-center justify-center text-white text-lg font-medium">
              Start Analysis
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
          <Link to={createPageUrl("HowItWorks")}>
            <div className="relative rounded-full group">
              <div
                className="relative rounded-full"
                style={{
                  background: `linear-gradient(135deg, 
                    #1a1a1a 0%, 
                    #181818 15%, 
                    #161616 30%, 
                    #141414 45%, 
                    #121212 60%, 
                    #101010 75%, 
                    #0e0e0e 90%, 
                    #000000 100%
                  )`,
                  border: `1px solid rgba(255, 255, 255, 0.2)`,
                  boxShadow: `
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
                  overflow: 'hidden',
                  transition: 'box-shadow 0.3s ease-out',
                  padding: '12px 32px',
                  cursor: 'pointer',
                }}
              >
                {/* Primary top edge ridge */}
                <div 
                  className="absolute inset-x-0 top-0 rounded-t-full pointer-events-none"
                  style={{
                    height: '2px',
                    background: `linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.6) 5%, rgba(255, 255, 255, 0.8) 15%, rgba(255, 255, 255, 0.8) 85%, rgba(255, 255, 255, 0.6) 95%, rgba(255, 255, 255, 0) 100%)`,
                    filter: 'blur(0.5px)',
                  }}
                />
                
                {/* Top hemisphere light catch */}
                <div 
                  className="absolute inset-x-0 top-0 rounded-full pointer-events-none"
                  style={{
                    height: '55%',
                    background: `linear-gradient(180deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 30%, rgba(255, 255, 255, 0.08) 60%, rgba(255, 255, 255, 0) 100%)`,
                  }}
                />
                
                {/* Directional light - top left */}
                <div 
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    background: `linear-gradient(135deg, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.12) 20%, rgba(255, 255, 255, 0.05) 40%, rgba(255, 255, 255, 0) 65%)`,
                  }}
                />
                
                {/* Premium gloss reflection */}
                <div 
                  className="absolute rounded-full pointer-events-none"
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

                {/* Inner diffuse glow */}
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

                {/* Button content */}
                <div className="relative z-10 flex items-center justify-center text-white text-lg font-medium">
              Learn More
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Trust Indicator */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-cyan-400/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{
                  background: 'linear-gradient(to right, #22d3ee, #a855f7, #ec4899)'
                }}
              />
            </div>
            <span>HIPAA Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-cyan-400/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{
                  background: 'linear-gradient(to right, #22d3ee, #a855f7, #ec4899)'
                }}
              />
            </div>
            <span>Privacy Protected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-cyan-400/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{
                  background: 'linear-gradient(to right, #22d3ee, #a855f7, #ec4899)'
                }}
              />
            </div>
            <span>Instant Results</span>
          </div>
        </div>
      </div>
    </section>
  );
}
