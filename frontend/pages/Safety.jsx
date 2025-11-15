import React from "react";
import { Lock, Ban, Shield, Database } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";

const GridItem = ({ icon, title, description }) => {
  return (
    <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-[1.5rem] md:p-3">
      <GlowingEffect
        spread={40}
        glow={true}
        disabled={false}
        proximity={64}
        inactiveZone={0.01}
        borderWidth={3}
      />
      <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] bg-background p-6 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)] md:p-6">
        <div className="relative flex flex-1 flex-col justify-between gap-3">
          <div className="w-fit rounded-lg border-[0.75px] border-border bg-muted p-2">
            {icon}
          </div>
          <div className="space-y-3">
            <h3 className="pt-0.5 text-xl leading-[1.375rem] font-semibold font-sans tracking-[-0.04em] md:text-2xl md:leading-[1.875rem] text-balance text-foreground">
              {title}
            </h3>
            <h2 className="[&_b]:md:font-semibold [&_strong]:md:font-semibold font-sans text-sm leading-[1.125rem] md:text-base md:leading-[1.375rem] text-muted-foreground">
              {description}
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Safety() {
  const securityCards = [
    {
      icon: <Lock className="h-4 w-4" />,
      title: "End to End Encryption",
      description: "Your data is protected with industry-standard encryption",
    },
    {
      icon: <Ban className="h-4 w-4" />,
      title: "No Data Selling",
      description: "We never sell or share your personal information",
    },
    {
      icon: <Shield className="h-4 w-4" />,
      title: "HIPAA Compliant",
      description: "Meets all healthcare privacy and security standards",
    },
    {
      icon: <Database className="h-4 w-4" />,
      title: "Secure Storage",
      description: "Bank-level security for all stored data",
    },
  ];

  return (
    <div className="relative min-h-screen px-6 py-16">
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16 pt-32 md:pt-40">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Safety & <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Privacy</span>
          </h1>
        </div>

        {/* Glowing Effect Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {securityCards.map((card, index) => (
            <div key={index} className="min-h-[14rem]">
              <GridItem
                icon={card.icon}
                title={card.title}
                description={card.description}
              />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}