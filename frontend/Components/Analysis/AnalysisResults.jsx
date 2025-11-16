import React, { useState, useRef, useEffect } from "react";
import { SendIcon, XIcon, LoaderIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Helper function to format markdown-style text
const formatText = (text) => {
  if (!text) return text;

  // Convert **bold** to <strong>
  let formatted = text.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');

  // Convert *italic* to <em>
  formatted = formatted.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');

  // Convert ### Headers to styled headers
  formatted = formatted.replace(/###\s+(.+?)(\n|$)/g, '<h3 class="text-base font-bold text-white mt-3 mb-2">$1</h3>');

  // Convert ## Headers to styled headers
  formatted = formatted.replace(/##\s+(.+?)(\n|$)/g, '<h2 class="text-lg font-bold text-white mt-4 mb-2">$1</h2>');

  // Convert bullet points (-, *, •) to styled list items
  formatted = formatted.replace(/^[\-\*•]\s+(.+?)$/gm, '<li class="ml-4 mb-1">• $1</li>');

  // Convert numbered lists
  formatted = formatted.replace(/^\d+\.\s+(.+?)$/gm, '<li class="ml-4 mb-1">$1</li>');

  // Convert line breaks to <br>
  formatted = formatted.replace(/\n/g, '<br/>');

  return formatted;
};

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
      // Call backend /chat endpoint with conversation history
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userQuestion,
          conversation_history: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          analysis_context: {
            condition: results.condition_name,
            severity: results.severity,
            confidence: results._raw_backend_data?.confidence,
            predictions: results._raw_backend_data?.all_predictions,
          }
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from AI");
      }

      const data = await response.json();

      if (data.success) {
        const aiMessage = {
          id: messages.length + 2,
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        throw new Error(data.error || "Failed to generate response");
      }

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
                "max-w-4xl rounded-xl p-5",
                "bg-white/10 border border-white/20 text-white"
              )}
              style={{
                boxShadow: `0 0 8px rgba(255, 255, 255, 0.1), 0 0 16px rgba(255, 255, 255, 0.05)`,
              }}
            >
              <div
                className="text-sm prose prose-invert max-w-none leading-relaxed"
                style={{ wordBreak: 'break-word' }}
                dangerouslySetInnerHTML={{ __html: formatText(message.content) }}
              />
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
