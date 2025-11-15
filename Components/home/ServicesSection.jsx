import React from "react";
import { Scan, AlertTriangle, FileText, Clock } from "lucide-react";

export default function ServicesSection() {
  const services = [
    {
      icon: Scan,
      title: "AI-Powered Detection",
      description: "Advanced machine learning algorithms analyze your skin condition with medical-grade accuracy, identifying potential issues instantly.",
      features: ["Real-time analysis", "Multiple condition detection", "95%+ accuracy rate"]
    },
    {
      icon: AlertTriangle,
      title: "Risk Assessment",
      description: "Get immediate guidance on whether your condition requires professional medical attention or can be monitored at home.",
      features: ["Severity classification", "Urgency indicators", "Clear recommendations"]
    },
    {
      icon: FileText,
      title: "Detailed Reports",
      description: "Receive comprehensive analysis reports with condition details, care recommendations, and next steps for your health.",
      features: ["PDF export", "Sharable results", "Track history"]
    },
    {
      icon: Clock,
      title: "24/7 Availability",
      description: "Access instant skin analysis anytime, anywhere. No appointments needed, just upload and receive results in seconds.",
      features: ["Always accessible", "Instant results", "Mobile friendly"]
    }
  ];

  return (
    <section className="relative py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-white/60 text-sm font-medium mb-4 uppercase tracking-wider">
            Our Services
          </p>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            AI Solutions That Keep Your
            <br />
            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Skin Health in Check
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            We leverage cutting-edge AI technology to provide instant, accurate skin analysis that helps you make informed healthcare decisions.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {services.map((service, index) => (
            <div
              key={index}
              className="glass-card rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <service.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                </div>
              </div>
              
              <p className="text-gray-400 mb-6 leading-relaxed">
                {service.description}
              </p>

              <div className="space-y-2">
                {service.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-1 h-1 rounded-full bg-white/60" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}