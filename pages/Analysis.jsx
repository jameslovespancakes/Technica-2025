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
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });

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

      // Analyze with AI
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        file_urls: [file_url],
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
        <div className="text-center mb-8 pt-32 md:pt-40">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Skin Analysis
          </h1>
          <p className="text-gray-400 text-lg">
            Upload a clear photo of your skin condition for instant AI-powered analysis
          </p>
        </div>

        {/* Main Content */}
        {!results ? (
          <div className="space-y-4">
            {/* AI Chat Interface */}
            <AnimatedAIChat 
              onMessageSend={handleMessageSend}
              onImageUpload={handleImageUpload}
            />

            {/* Medical Disclaimer */}
            <p className="text-xs text-gray-500 text-center">
              <strong className="text-gray-400">Medical Disclaimer:</strong> This tool is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment.
            </p>

            {/* Image Preview and Analysis (if image uploaded) */}
            {file && previewUrl && (
              <div className="glass-card rounded-3xl p-8 md:p-12">
                <div className="space-y-6">
                  {/* Image Preview */}
                  <div className="relative rounded-2xl overflow-hidden bg-black/30">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full max-h-96 object-contain"
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Action Buttons */}
                  {!analyzing && (
                    <div className="flex gap-4">
                      <Button
                        onClick={analyzeImage}
                        disabled={analyzing}
                        className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white py-6 text-lg"
                      >
                        Analyze Image
                      </Button>
                      <Button
                        onClick={resetAnalysis}
                        variant="outline"
                        className="px-8 py-6 border-white/20 hover:bg-white/10"
                        disabled={analyzing}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <AnalysisResults
            results={results}
            imageUrl={previewUrl}
            onNewAnalysis={resetAnalysis}
          />
        )}
      </div>
    </div>
  );
}