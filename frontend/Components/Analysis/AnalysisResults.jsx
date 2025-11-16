import React, { useState, useRef, useEffect } from "react";
import { SendIcon, XIcon, LoaderIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function AnalysisResults({ results, imageUrl, onNewAnalysis }) {
  // Get full Gemini explanation from results
  const geminiExplanation = results._raw_backend_data?.ai_explanation || 
    results.ai_explanation || 
    `I've analyzed your skin image and found: **${results.condition_name}** (${results.severity} severity). ${results.seek_professional_help ? "I recommend consulting a healthcare professional." : "Continue monitoring this condition."}`;

  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content: geminiExplanation,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userQuestion = inputValue;
    setInputValue("");
    setIsLoading(true);

    try {
      // Use the existing analysis results to provide context-aware responses
      const conditionName = results.condition_name;
      const severity = results.severity;
      const recommendations = results.recommendations || [];
      const keyObservations = results.key_observations || [];
      
      // Generate a helpful response based on the question and analysis
      let aiResponse = `Based on the analysis of your ${conditionName} condition (${severity} severity), `;
      
      // Check if question is about recommendations
      if (userQuestion.toLowerCase().includes('recommend') || userQuestion.toLowerCase().includes('what should') || userQuestion.toLowerCase().includes('how to')) {
        aiResponse += `here are some recommendations:\n\n`;
        recommendations.forEach((rec, idx) => {
          aiResponse += `${idx + 1}. ${rec}\n`;
        });
        aiResponse += `\nPlease consult with a healthcare professional for personalized advice.`;
      }
      // Check if question is about severity
      else if (userQuestion.toLowerCase().includes('severe') || userQuestion.toLowerCase().includes('serious') || userQuestion.toLowerCase().includes('bad')) {
        aiResponse += `the condition is classified as ${severity} severity. `;
        if (results.seek_professional_help) {
          aiResponse += `I strongly recommend consulting a healthcare professional for proper evaluation and treatment.`;
        } else {
          aiResponse += `Continue monitoring the condition and seek medical attention if symptoms worsen.`;
        }
      }
      // Check if question is about professional help
      else if (userQuestion.toLowerCase().includes('doctor') || userQuestion.toLowerCase().includes('professional') || userQuestion.toLowerCase().includes('medical')) {
        if (results.seek_professional_help) {
          aiResponse += `yes, I recommend consulting a healthcare professional. Given the ${severity} severity, it's important to get a proper medical evaluation.`;
        } else {
          aiResponse += `while this appears to be a ${severity} case, it's always wise to consult a healthcare professional for proper diagnosis and treatment.`;
        }
      }
      // Check if question is about symptoms/observations
      else if (userQuestion.toLowerCase().includes('symptom') || userQuestion.toLowerCase().includes('observe') || userQuestion.toLowerCase().includes('characteristic')) {
        aiResponse += `key observations include:\n\n`;
        keyObservations.forEach((obs, idx) => {
          aiResponse += `${idx + 1}. ${obs}\n`;
        });
      }
      // Default response - reference the full explanation
      else {
        aiResponse += `regarding your question: "${userQuestion}" - `;
        aiResponse += `Based on the analysis, this appears to be ${conditionName} with ${severity} severity. `;
        if (recommendations.length > 0) {
          aiResponse += `Key recommendations include: ${recommendations.slice(0, 2).join(', ')}. `;
        }
        aiResponse += `For specific concerns, please refer to the detailed analysis above or consult with a healthcare professional.`;
      }

      const aiMessage = {
        id: messages.length + 2,
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    } catch (error) {
      console.error("Error generating response:", error);
      const errorMessage = {
        id: messages.length + 2,
        role: "assistant",
        content: "I apologize, but I'm having trouble processing your question. Please try rephrasing it or consult the analysis results above.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="w-full h-full flex flex-col relative">
      {/* Chat Container */}
      <div className="flex-1 overflow-y-auto pb-4 space-y-4">
        {/* Initial Analysis Summary */}
        <div className="flex justify-start">
          <div className="max-w-xs bg-black border border-white/30 rounded-xl p-4">
            <div className="flex gap-3">
              <img
                src={imageUrl}
                alt="Analyzed"
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-1">Analysis Complete</p>
                <p className="text-sm font-semibold">{results.condition_name}</p>
                <p className="text-xs text-gray-400">{results.severity} Severity</p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-xs rounded-xl p-4",
                "bg-white/10 border border-white/20 text-white"
              )}
              style={{
                boxShadow: `0 0 8px rgba(255, 255, 255, 0.1), 0 0 16px rgba(255, 255, 255, 0.05)`,
              }}
            >
              <p className="text-sm">{message.content}</p>
              <p className="text-xs text-gray-500 mt-2">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </motion.div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-black border border-white/30 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <LoaderIcon className="w-4 h-4 animate-spin text-white/60" />
                <span className="text-sm text-gray-400">AI is thinking...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="mt-6 pt-6">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Ask a follow-up question..."
              className="w-full px-4 py-3 bg-black border border-white/30 rounded-lg text-white placeholder:text-gray-500 text-sm resize-none outline-none focus:outline-none transition-all"
              rows="1"
              style={{
                boxShadow: isFocused || inputValue.trim()
                  ? `0 0 12px rgba(255, 255, 255, 0.2), 0 0 24px rgba(255, 255, 255, 0.1)`
                  : `0 0 8px rgba(255, 255, 255, 0.15), 0 0 16px rgba(255, 255, 255, 0.08)`,
              }}
            />
            {/* Subtle backlighting */}
            <div
              className="absolute inset-0 rounded-lg pointer-events-none"
              style={{
                background: `radial-gradient(circle at center, rgba(255, 255, 255, 0.08) 0%, transparent 60%)`,
              }}
            />
          </div>
          <motion.button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "p-3 rounded-lg relative transition-all flex items-center justify-center",
              inputValue.trim()
                ? "bg-black border border-white/30 text-white hover:border-white/50"
                : "bg-black/50 border border-white/20 text-white/40 cursor-not-allowed"
            )}
            style={{
              boxShadow:
                inputValue.trim() || isLoading
                  ? `0 0 12px rgba(255, 255, 255, 0.2), 0 0 24px rgba(255, 255, 255, 0.1)`
                  : `0 0 6px rgba(255, 255, 255, 0.1), 0 0 12px rgba(255, 255, 255, 0.05)`,
            }}
          >
            {/* Subtle backlighting */}
            {(inputValue.trim() || isLoading) && (
              <div
                className="absolute inset-0 rounded-lg pointer-events-none"
                style={{
                  background: `radial-gradient(circle at center, rgba(255, 255, 255, 0.1) 0%, transparent 60%)`,
                }}
              />
            )}
            {isLoading ? (
              <LoaderIcon className="w-5 h-5 animate-spin relative z-10" />
            ) : (
              <SendIcon className="w-5 h-5 relative z-10" />
            )}
          </motion.button>
          <motion.button
            onClick={onNewAnalysis}
            whileTap={{ scale: 0.95 }}
            className="p-3 rounded-lg bg-black border border-white/30 text-white hover:border-white/50 transition-all relative"
            style={{
              boxShadow: `0 0 8px rgba(255, 255, 255, 0.15), 0 0 16px rgba(255, 255, 255, 0.08)`,
            }}
            title="Start new analysis"
          >
            {/* Subtle backlighting */}
            <div
              className="absolute inset-0 rounded-lg pointer-events-none"
              style={{
                background: `radial-gradient(circle at center, rgba(255, 255, 255, 0.08) 0%, transparent 60%)`,
              }}
            />
            <XIcon className="w-5 h-5 relative z-10" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
