import React from "react";
import HeroSection from "../Components/Home/HeroSection";

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* Neutral Glow Effects */}
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-white/5 rounded-full glow-effect" />
      
      <HeroSection />
    </div>
  );
}
