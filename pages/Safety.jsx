import React from "react";
import { Shield, Lock, Eye, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Safety() {
  const privacyFeatures = [
    {
      icon: Lock,
      title: "End-to-End Encryption",
      description: "All images and data are encrypted during transmission and storage using industry-standard protocols."
    },
    {
      icon: Eye,
      title: "No Data Selling",
      description: "We never sell, share, or monetize your personal health information. Your data is yours alone."
    },
    {
      icon: FileText,
      title: "HIPAA Compliant",
      description: "Our platform meets HIPAA standards for handling sensitive medical information and patient privacy."
    },
    {
      icon: Shield,
      title: "Secure Storage",
      description: "Your images are securely stored with automatic deletion options and bank-level security measures."
    }
  ];

  const limitations = [
    "DermaAI is a screening tool, not a diagnostic tool",
    "Results should not replace professional medical evaluation",
    "Emergency conditions require immediate medical attention",
    "The AI may not detect all conditions or rare diseases",
    "Image quality significantly affects analysis accuracy"
  ];

  return (
    <div className="relative min-h-screen px-6 py-16">
      {/* Neutral Glow Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full glow-effect" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/3 rounded-full glow-effect" />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16 pt-48 md:pt-56">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Safety & <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Privacy</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Your privacy and safety are our top priorities. Learn how we protect your data and the limitations of our service.
          </p>
        </div>

        {/* Important Notice */}
        <Alert className="mb-12 bg-yellow-950/20 border-yellow-500/30">
          <AlertCircle className="h-5 w-5 text-yellow-500" />
          <AlertDescription className="text-yellow-200">
            <strong>Medical Disclaimer:</strong> DermaAI is an informational tool designed to help you understand when to seek professional care. It is NOT a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for medical concerns.
          </AlertDescription>
        </Alert>

        {/* Privacy Features */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-8">How We Protect Your Privacy</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {privacyFeatures.map((feature, index) => (
              <div
                key={index}
                className="glass-card rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Data Usage */}
        <div className="glass-card rounded-3xl p-8 md:p-12 mb-12">
          <h2 className="text-3xl font-bold mb-6">How We Use Your Data</h2>
          <div className="space-y-4 text-gray-300">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold mb-1">Analysis Only</p>
                <p className="text-gray-400">Your images are used solely to provide you with skin analysis results.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold mb-1">Temporary Storage</p>
                <p className="text-gray-400">Images are temporarily stored for your session and can be deleted at any time.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold mb-1">Anonymized Improvement</p>
                <p className="text-gray-400">With your consent, anonymized data may be used to improve our AI models.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold mb-1">No Third-Party Sharing</p>
                <p className="text-gray-400">We never share your personal health information with third parties for marketing or other purposes.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Limitations */}
        <div className="glass-card rounded-3xl p-8 md:p-12 mb-12">
          <h2 className="text-3xl font-bold mb-6">Understanding Our Limitations</h2>
          <p className="text-gray-300 mb-6">
            While DermaAI uses advanced AI technology, it's important to understand what our service can and cannot do:
          </p>
          <div className="space-y-3">
            {limitations.map((limitation, index) => (
              <div key={index} className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-white/60 flex-shrink-0 mt-0.5" />
                <p className="text-gray-400">{limitation}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Notice */}
        <Alert className="bg-red-950/30 border-red-500/30">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <AlertDescription className="text-red-200">
            <strong>Emergency Warning:</strong> If you are experiencing a medical emergency, severe symptoms, rapid changes, or signs of infection (fever, spreading redness, severe pain), seek immediate medical attention. Call 911 or visit your nearest emergency room. Do not rely on this app for emergency situations.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}