import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export default function CTASection() {
  return (
    <section className="relative py-24 px-6">
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent" />
      
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="glass-card rounded-3xl p-12 md:p-16 text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 border border-white/20 mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>

          {/* Heading */}
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Analyze Your Skin?
          </h2>

          {/* Description */}
          <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
            Get instant AI-powered analysis and find out if you need professional medical care. Quick, private, and reliable.
          </p>

          {/* CTA Button */}
          <Link to={createPageUrl("Analysis")}>
            <Button className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-10 py-6 text-lg group">
              Start Free Analysis
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>

          {/* Trust Badge */}
          <p className="text-sm text-gray-500 mt-6">
            No signup required • Results in seconds • 100% private
          </p>
        </div>
      </div>
    </section>
  );
}