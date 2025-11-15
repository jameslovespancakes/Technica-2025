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
            <Button className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-6 text-lg group">
              Start Analysis
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link to={createPageUrl("HowItWorks")}>
            <Button variant="ghost" className="text-white hover:text-gray-300 px-8 py-6 text-lg">
              Learn More
            </Button>
          </Link>
        </div>

        {/* Trust Indicator */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-green-500" />
            </div>
            <span>HIPAA Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-green-500" />
            </div>
            <span>Privacy Protected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-green-500" />
            </div>
            <span>Instant Results</span>
          </div>
        </div>
      </div>
    </section>
  );
}
