import React from "react";
import { Shield, Award, Users, Stethoscope } from "lucide-react";

export default function TrustBadges() {
  const badges = [
    { icon: Shield, label: "HIPAA Certified" },
    { icon: Award, label: "Medical Grade AI" },
    { icon: Users, label: "50K+ Users" },
    { icon: Stethoscope, label: "Clinically Validated" },
  ];

  return (
    <section className="relative z-10 py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <p className="text-center text-gray-500 text-sm mb-8 uppercase tracking-wider">
          Trusted by Healthcare Professionals
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {badges.map((badge, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-3 group cursor-pointer"
            >
              <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300">
                <badge.icon className="w-8 h-8 text-gray-400 group-hover:text-white transition-colors" />
              </div>
              <span className="text-sm text-gray-400 group-hover:text-white transition-colors text-center">
                {badge.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}