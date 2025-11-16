// Backend API Client
// Connects frontend to Flask backend

// Backend API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const base44 = {
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        try {
          // Create FormData to send file
          const formData = new FormData();
          formData.append("image", file);

          // Make POST request to backend /upload endpoint
          const response = await fetch(`${API_BASE_URL}/upload`, {
            method: "POST",
            body: formData,
          });

          // Check if request was successful
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Upload failed");
          }

          // Parse response
          const data = await response.json();

          // Store upload response in sessionStorage for InvokeLLM to use
          sessionStorage.setItem('last_upload_response', JSON.stringify(data));

          // Return file URL (using the path from backend response)
          // For now, return a local object URL since backend returns file path
          // Later, this can be updated to return actual server URL
          return {
            file_url: URL.createObjectURL(file),
            backend_response: data, // Include backend response for debugging
            filename: data.filename, // Include filename for easy access
          };
        } catch (error) {
          console.error("Upload error:", error);
          throw error;
        }
      },
      InvokeLLM: async ({ prompt, file_urls, response_json_schema, filename, user_context }) => {
        try {
          // Get filename from parameter, sessionStorage, or throw error
          let analysisFilename = filename;
          
          // If not provided, try to get from sessionStorage (stored during upload)
          if (!analysisFilename) {
            const uploadResponse = sessionStorage.getItem('last_upload_response');
            if (uploadResponse) {
              const uploadData = JSON.parse(uploadResponse);
              analysisFilename = uploadData.filename;
            }
          }

          if (!analysisFilename) {
            throw new Error("No filename available. Please upload an image first.");
          }

          // Extract user context from prompt or user_context parameter
          const userDescription = user_context || prompt || "";

          // Call backend /analyze endpoint with user context
          const response = await fetch(`${API_BASE_URL}/analyze`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
              filename: analysisFilename,
              user_context: userDescription 
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Analysis failed");
          }

          const analysisData = await response.json();

          // Transform backend response to frontend expected format
          if (!analysisData.success || !analysisData.primary_condition) {
            throw new Error("No detection results available");
          }

          // Parse Gemini explanation to extract structured data
          const explanation = analysisData.ai_explanation || "";

          // Get primary prediction
          const primaryCondition = analysisData.primary_condition;
          const confidence = analysisData.confidence;

          // Determine severity based on confidence
          let severity = "Mild";
          if (confidence >= 80) {
            severity = "Severe";
          } else if (confidence >= 60) {
            severity = "Moderate";
          }

          // Determine if professional help is needed (high confidence = yes)
          const seek_professional_help = confidence >= 70;

          // Extract observations and recommendations from Gemini explanation
          // Try to parse structured content from explanation
          const key_observations = [];
          const recommendations = [];

          // Simple parsing - look for common patterns in Gemini response
          const obsMatch = explanation.match(/[Ss]ymptoms?[:\-]?\s*([^\n]+(?:\n[^\n]+)*?)(?=\n\n|\n[Rr]ecommend|[Cc]are|$)/i);
          const recMatch = explanation.match(/[Rr]ecommendations?[:\-]?\s*([^\n]+(?:\n[^\n]+)*?)(?=\n\n|$)/i);

          if (obsMatch) {
            const obsText = obsMatch[1];
            obsText.split(/\n|•|[-*]/).forEach(line => {
              const trimmed = line.trim();
              if (trimmed && trimmed.length > 10) {
                key_observations.push(trimmed);
              }
            });
          }

          if (recMatch) {
            const recText = recMatch[1];
            recText.split(/\n|•|[-*]/).forEach(line => {
              const trimmed = line.trim();
              if (trimmed && trimmed.length > 10) {
                recommendations.push(trimmed);
              }
            });
          }

          // Fallback if parsing didn't work
          if (key_observations.length === 0) {
            key_observations.push(`Detected condition: ${primaryCondition.replace(/_/g, ' ')}`);
            key_observations.push(`Confidence level: ${confidence}%`);

            // Add top predictions if available
            if (analysisData.predictions && analysisData.predictions.length > 1) {
              key_observations.push(`Alternative possibilities: ${analysisData.predictions.slice(1, 3).map(p => p.condition.replace(/_/g, ' ')).join(', ')}`);
            }
          }

          if (recommendations.length === 0 && explanation) {
            // If we have Gemini explanation, use it directly as a recommendation
            recommendations.push(explanation);
          } else if (recommendations.length === 0) {
            recommendations.push("Consult with a healthcare professional for proper diagnosis");
            recommendations.push("Follow medical advice for treatment");
          }

          return {
            condition_name: primaryCondition.replace(/_/g, ' '),
            severity: severity,
            seek_professional_help: seek_professional_help,
            key_observations: key_observations.slice(0, 5), // Limit to 5
            recommendations: recommendations.slice(0, 5), // Limit to 5
            disclaimer: "This analysis is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare provider.",
            // Include raw backend data for debugging
            _raw_backend_data: {
              confidence: confidence,
              all_predictions: analysisData.predictions,
              ai_explanation: explanation,
              explanation_available: analysisData.explanation_available,
              mock: analysisData.mock,
            }
          };
        } catch (error) {
          console.error("Analysis error:", error);
          throw error;
        }
      }
    }
  }
};

