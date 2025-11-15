import React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AnalysisResults({ results, imageUrl, onNewAnalysis }) {
  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "mild":
        return "text-green-400 bg-green-950/30 border-green-500/30";
      case "moderate":
        return "text-yellow-400 bg-yellow-950/30 border-yellow-500/30";
      case "severe":
        return "text-red-400 bg-red-950/30 border-red-500/30";
      default:
        return "text-gray-400 bg-gray-950/30 border-gray-500/30";
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity?.toLowerCase()) {
      case "mild":
        return CheckCircle2;
      case "moderate":
        return AlertTriangle;
      case "severe":
        return AlertCircle;
      default:
        return AlertCircle;
    }
  };

  const SeverityIcon = getSeverityIcon(results.severity);

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="glass-card rounded-3xl p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
            <SeverityIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Analysis Complete</h2>
            <p className="text-gray-400">Here are your results</p>
          </div>
        </div>

        {/* Image Preview */}
        <div className="rounded-xl overflow-hidden mb-6 bg-black/30">
          <img
            src={imageUrl}
            alt="Analyzed skin"
            className="w-full max-h-64 object-contain"
          />
        </div>

        {/* Condition & Severity */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="glass-card rounded-xl p-4">
            <p className="text-sm text-gray-400 mb-1">Identified Condition</p>
            <p className="text-xl font-semibold">{results.condition_name}</p>
          </div>
          <div className={`rounded-xl p-4 border ${getSeverityColor(results.severity)}`}>
            <p className="text-sm opacity-80 mb-1">Severity Level</p>
            <p className="text-xl font-semibold">{results.severity}</p>
          </div>
        </div>

        {/* Professional Help Alert */}
        {results.seek_professional_help ? (
          <Alert className="bg-red-950/30 border-red-500/30 mb-6">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <AlertDescription className="text-red-200">
              <strong>Medical Attention Recommended:</strong> Based on the analysis, we recommend consulting a healthcare professional for proper diagnosis and treatment.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="bg-green-950/30 border-green-500/30 mb-6">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <AlertDescription className="text-green-200">
              <strong>Monitoring Recommended:</strong> While professional care may not be urgently needed, continue to monitor the condition. Consult a doctor if it worsens.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Key Observations */}
      <div className="glass-card rounded-3xl p-8">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white/60" />
          Key Observations
        </h3>
        <ul className="space-y-3">
          {results.key_observations?.map((observation, index) => (
            <li key={index} className="flex items-start gap-3 text-gray-300">
              <ArrowRight className="w-5 h-5 text-white/60 mt-0.5 flex-shrink-0" />
              <span>{observation}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Recommendations */}
      <div className="glass-card rounded-3xl p-8">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white/60" />
          Recommendations
        </h3>
        <ul className="space-y-3">
          {results.recommendations?.map((recommendation, index) => (
            <li key={index} className="flex items-start gap-3 text-gray-300">
              <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span>{recommendation}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Disclaimer */}
      {results.disclaimer && (
        <Alert className="bg-yellow-950/20 border-yellow-500/30">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-200 text-sm">
            {results.disclaimer}
          </AlertDescription>
        </Alert>
      )}

      {/* Action Button */}
      <div className="flex justify-center">
        <Button
          onClick={onNewAnalysis}
          className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-6 text-lg"
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          Analyze Another Image
        </Button>
      </div>
    </div>
  );
}