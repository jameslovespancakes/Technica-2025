import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Upload, Camera, Loader2, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import UploadZone from "../Components/Analysis/UploadZone";
import AnalysisResults from "../Components/Analysis/AnalysisResults";
import { AnimatedAIChat } from "@/components/ui/animated-ai-chat";

export default function Analysis() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [description, setDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setResults(null);
    setError(null);
  };

  const handleMessageSend = async (data) => {
    // Handle message from chat component
    if (data.images && data.images.length > 0) {
      const firstImage = data.images[0];
      handleFileSelect(firstImage.file);
    }
    
    if (data.message) {
      setDescription(data.message);
    }

    // If we have an image, analyze it
    if (data.images && data.images.length > 0) {
      const firstImage = data.images[0];
      await analyzeWithImage(firstImage.file, data.message || "");
    }
  };

  const handleImageUpload = (imageFile) => {
    handleFileSelect(imageFile);
  };

  const analyzeWithImage = async (imageFile, userDescription = "") => {
    if (!imageFile) return;

    setAnalyzing(true);
    setError(null);
    setFile(imageFile);
    setPreviewUrl(URL.createObjectURL(imageFile));

    try {
      // Upload the file
      const { file_url, backend_response } = await base44.integrations.Core.UploadFile({ file: imageFile });

      // Build prompt with user description if provided
      const basePrompt = `You are a medical AI assistant specializing in dermatology. Analyze this skin image and provide:
        
        1. A clear identification of what the condition appears to be
        2. A severity level (Mild, Moderate, Severe)
        3. Whether the person should seek professional medical care (Yes/No)
        4. Key symptoms or characteristics you observe
        5. Recommended next steps and care instructions
        
        Be professional, clear, and helpful. Always err on the side of caution.`;

      const prompt = userDescription 
        ? `${basePrompt}\n\nUser's description: ${userDescription}`
        : basePrompt;

      // Analyze with AI - pass filename and user context from upload response
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        file_urls: [file_url],
        filename: backend_response?.filename, // Pass filename from upload
        user_context: userDescription, // Pass user's text description/context
        response_json_schema: {
          type: "object",
          properties: {
            condition_name: { type: "string" },
            severity: { type: "string", enum: ["Mild", "Moderate", "Severe"] },
            seek_professional_help: { type: "boolean" },
            key_observations: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } },
            disclaimer: { type: "string" }
          }
        }
      });

      setResults(analysis);
    } catch (err) {
      setError("Unable to analyze the image. Please try again with a clear photo of the affected area.");
      console.error("Analysis error:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const analyzeImage = async () => {
    if (!file) return;
    await analyzeWithImage(file, description);
  };

  const resetAnalysis = () => {
    setFile(null);
    setPreviewUrl(null);
    setDescription("");
    setResults(null);
    setError(null);
  };

  return (
    <div className="relative min-h-screen px-6 py-16">
      {/* Neutral Glow Effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-white/5 rounded-full glow-effect" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-white/3 rounded-full glow-effect" />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        {!results && (
          <div className="text-center mb-8 pt-32 md:pt-40">
            <h1 
              className="text-4xl md:text-5xl font-bold mb-4 pb-2 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-500 via-gray-200 to-gray-600 bg-[length:200%_auto] animate-shimmer"
              style={{
                backgroundSize: '200% auto',
                animation: 'shimmer 3s ease-in-out infinite',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Skin Analysis
            </h1>
            <style>{`
              @keyframes shimmer {
                0% {
                  background-position: 0% center;
                }
                50% {
                  background-position: 100% center;
                }
                100% {
                  background-position: 0% center;
                }
              }
            `}</style>
            <p className="text-gray-400 text-lg mb-2">
              Upload a clear photo of your skin condition for instant AI-powered analysis
            </p>
            {/* Medical Disclaimer */}
            <p className="text-xs text-gray-500 text-center">
              <strong className="text-gray-400">Medical Disclaimer:</strong> This tool is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment.
            </p>
          </div>
        )}

        {/* Main Content */}
        {!results ? (
          <div className="space-y-4">
            {/* AI Chat Interface */}
            <AnimatedAIChat 
              onMessageSend={handleMessageSend}
              onImageUpload={handleImageUpload}
            />
          </div>
        ) : (
          <div className="bg-black border border-white/30 rounded-2xl p-6 h-[500px] flex flex-col relative mt-32"
            style={{
              boxShadow: `0 0 12px rgba(255, 255, 255, 0.2), 0 0 24px rgba(255, 255, 255, 0.1)`,
            }}
          >
            {/* Subtle backlighting */}
            <div 
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background: `radial-gradient(circle at center, rgba(255, 255, 255, 0.1) 0%, transparent 60%)`,
              }}
            />
            <div className="relative z-10 h-full flex flex-col">
              <AnalysisResults
                results={results}
                imageUrl={previewUrl}
                onNewAnalysis={resetAnalysis}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}