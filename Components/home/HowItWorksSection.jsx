import React from "react";
import { Upload, Brain, FileCheck } from "lucide-react";

export default function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      icon: Upload,
      title: "Upload Your Image",
      description: "Take a clear photo of the affected skin area using your phone or camera. Our system accepts multiple image formats."
    },
    {
      number: "02",
      icon: Brain,
      title: "AI Analysis",
      description: "Our advanced AI model processes your image in seconds, comparing it against thousands of known skin conditions."
    },
    {
      number: "03",
      icon: FileCheck,
      title: "Get Your Results",
      description: "Receive a detailed analysis with condition identification, severity assessment, and clear recommendations for next steps."
    }
  ];

  return (
    <section className="relative py-24 px-6 bg-gradient-to-b from-transparent to-white/5">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-white/60 text-sm font-medium mb-4 uppercase tracking-wider">
            How It Works
          </p>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Get Answers in Three Simple Steps
          </h2>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative group">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-24 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-white/30 to-transparent" />
              )}

              <div className="glass-card rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 h-full">
                {/* Step Number */}
                <div className="text-6xl font-bold text-white/10 mb-4">
                  {step.number}
                </div>

                {/* Icon */}
                <div className="w-16 h-16 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <step.icon className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-semibold mb-4">{step.title}</h3>
                <p className="text-gray-400 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}