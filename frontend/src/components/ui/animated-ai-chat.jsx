"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import {
    ImageIcon,
    FileUp,
    CircleUserRound,
    ArrowUpIcon,
    Paperclip,
    PlusIcon,
    SendIcon,
    XIcon,
    LoaderIcon,
    Sparkles,
    Command,
    Upload,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";

function useAutoResizeTextarea({ minHeight, maxHeight }) {
    const textareaRef = useRef(null);

    const adjustHeight = useCallback(
        (reset) => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            if (reset) {
                textarea.style.height = `${minHeight}px`;
                return;
            }

            textarea.style.height = `${minHeight}px`;
            const newHeight = Math.max(
                minHeight,
                Math.min(
                    textarea.scrollHeight,
                    maxHeight ?? Number.POSITIVE_INFINITY
                )
            );

            textarea.style.height = `${newHeight}px`;
        },
        [minHeight, maxHeight]
    );

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = `${minHeight}px`;
        }
    }, [minHeight]);

    useEffect(() => {
        const handleResize = () => adjustHeight();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [adjustHeight]);

    return { textareaRef, adjustHeight };
}

const Textarea = React.forwardRef(({ className, containerClassName, showRing = true, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    
    return (
      <div className={cn("relative", containerClassName)}>
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/90",
            "transition-all duration-200 ease-in-out",
            "placeholder:text-white/40",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "focus:outline-none focus:border-white/20",
            showRing ? "focus-visible:ring-0 focus-visible:ring-offset-0" : "",
            className
          )}
          ref={ref}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        
        {showRing && isFocused && (
          <motion.span 
            className="absolute inset-0 rounded-md pointer-events-none ring-2 ring-offset-0 ring-white/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </div>
    );
});
Textarea.displayName = "Textarea";

export function AnimatedAIChat({ onMessageSend, onImageUpload }) {
    const [value, setValue] = useState("");
    const [attachments, setAttachments] = useState([]);
    const [uploadedImages, setUploadedImages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [activeSuggestion, setActiveSuggestion] = useState(-1);
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 60,
        maxHeight: 200,
    });
    const [inputFocused, setInputFocused] = useState(false);
    const commandPaletteRef = useRef(null);
    const fileInputRef = useRef(null);
    const dropZoneRef = useRef(null);

    const commandSuggestions = [
        { 
            icon: <Upload className="w-4 h-4" />, 
            label: "Upload Image", 
            description: "Upload a skin condition image", 
            prefix: "/upload" 
        },
        { 
            icon: <ImageIcon className="w-4 h-4" />, 
            label: "Analyze", 
            description: "Analyze your skin condition", 
            prefix: "/analyze" 
        },
        { 
            icon: <Sparkles className="w-4 h-4" />, 
            label: "Get Suggestions", 
            description: "Get treatment suggestions", 
            prefix: "/suggestions" 
        },
    ];

    useEffect(() => {
        if (value.startsWith('/') && !value.includes(' ')) {
            setShowCommandPalette(true);
            
            const matchingSuggestionIndex = commandSuggestions.findIndex(
                (cmd) => cmd.prefix.startsWith(value)
            );
            
            if (matchingSuggestionIndex >= 0) {
                setActiveSuggestion(matchingSuggestionIndex);
            } else {
                setActiveSuggestion(-1);
            }
        } else {
            setShowCommandPalette(false);
        }
    }, [value]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            const target = event.target;
            const commandButton = document.querySelector('[data-command-button]');
            
            if (commandPaletteRef.current && 
                !commandPaletteRef.current.contains(target) && 
                !commandButton?.contains(target)) {
                setShowCommandPalette(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleKeyDown = (e) => {
        if (showCommandPalette) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveSuggestion(prev => 
                    prev < commandSuggestions.length - 1 ? prev + 1 : 0
                );
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveSuggestion(prev => 
                    prev > 0 ? prev - 1 : commandSuggestions.length - 1
                );
            } else if (e.key === 'Tab' || e.key === 'Enter') {
                e.preventDefault();
                if (activeSuggestion >= 0) {
                    const selectedCommand = commandSuggestions[activeSuggestion];
                    setValue(selectedCommand.prefix + ' ');
                    setShowCommandPalette(false);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setShowCommandPalette(false);
            }
        } else if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value.trim()) {
                handleSendMessage();
            }
        }
    };

    const handleSendMessage = () => {
        if (value.trim() || uploadedImages.length > 0) {
            setIsTyping(true);
            
            // Call parent handler if provided
            if (onMessageSend) {
                onMessageSend({
                    message: value.trim(),
                    images: uploadedImages
                });
            }
            
            setTimeout(() => {
                setIsTyping(false);
                setValue("");
                adjustHeight(true);
            }, 2000);
        }
    };

    const handleAttachFile = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files || []);
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const imageUrl = event.target.result;
                    setUploadedImages(prev => [...prev, { file, url: imageUrl }]);
                    
                    // Call parent handler if provided
                    if (onImageUpload) {
                        onImageUpload(file);
                    }
                };
                reader.readAsDataURL(file);
            }
        });
        
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeAttachment = (index) => {
        setUploadedImages(prev => prev.filter((_, i) => i !== index));
    };

    const selectCommandSuggestion = (index) => {
        const selectedCommand = commandSuggestions[index];
        if (selectedCommand.prefix === '/upload') {
            handleAttachFile();
        } else {
            setValue(selectedCommand.prefix + ' ');
            setShowCommandPalette(false);
        }
    };

    // Drag and drop handlers
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Only set isDragging to false if leaving the drop zone entirely
        if (e.target === dropZoneRef.current) {
            setIsDragging(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files || []);
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const imageUrl = event.target.result;
                    setUploadedImages(prev => [...prev, { file, url: imageUrl }]);

                    // Call parent handler if provided
                    if (onImageUpload) {
                        onImageUpload(file);
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    };

    return (
        <div className="w-full max-w-3xl mx-auto relative">
            <motion.div 
                className="relative z-10 space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            >

                <motion.div
                    ref={dropZoneRef}
                    className={cn(
                        "relative rounded-2xl bg-black border overflow-hidden transition-all",
                        isDragging ? "border-white/60 border-2" : "border-white/30"
                    )}
                    style={{
                        boxShadow: isDragging
                            ? `0 0 20px rgba(255, 255, 255, 0.4), 0 0 40px rgba(255, 255, 255, 0.2)`
                            : `0 0 12px rgba(255, 255, 255, 0.2), 0 0 24px rgba(255, 255, 255, 0.1)`,
                    }}
                    initial={{ scale: 0.98 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    {/* Drag overlay */}
                    <AnimatePresence>
                        {isDragging && (
                            <motion.div
                                className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center pointer-events-none"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <div className="text-center">
                                    <Upload className="w-12 h-12 text-white/80 mx-auto mb-3" />
                                    <p className="text-white/80 text-lg font-medium">Drop image here</p>
                                    <p className="text-white/50 text-sm mt-1">Upload your skin condition image</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Subtle backlighting */}
                    <div
                        className="absolute inset-0 rounded-2xl pointer-events-none"
                        style={{
                            background: `radial-gradient(circle at center, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 40%, transparent 70%)`,
                        }}
                    />
                    <div className="relative z-10">
                    <AnimatePresence>
                        {showCommandPalette && (
                            <motion.div 
                                ref={commandPaletteRef}
                                className="absolute left-4 right-4 bottom-full mb-2 backdrop-blur-xl bg-black/90 rounded-lg z-50 shadow-lg border border-white/10 overflow-hidden"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                transition={{ duration: 0.15 }}
                            >
                                <div className="py-1 bg-black/95">
                                    {commandSuggestions.map((suggestion, index) => (
                                        <motion.div
                                            key={suggestion.prefix}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-2 text-xs transition-colors cursor-pointer",
                                                activeSuggestion === index 
                                                    ? "bg-white/10 text-white" 
                                                    : "text-white/70 hover:bg-white/5"
                                            )}
                                            onClick={() => selectCommandSuggestion(index)}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: index * 0.03 }}
                                        >
                                            <div className="w-5 h-5 flex items-center justify-center text-white/60">
                                                {suggestion.icon}
                                            </div>
                                            <div className="font-medium">{suggestion.label}</div>
                                            <div className="text-white/40 text-xs ml-1">
                                                {suggestion.prefix}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="p-4">
                        <Textarea
                            ref={textareaRef}
                            value={value}
                            onChange={(e) => {
                                setValue(e.target.value);
                                adjustHeight();
                            }}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setInputFocused(true)}
                            onBlur={() => setInputFocused(false)}
                            placeholder="Describe your skin condition, when it appeared, any symptoms..."
                            containerClassName="w-full"
                            className={cn(
                                "w-full px-4 py-3",
                                "resize-none",
                                "bg-transparent",
                                "border-none",
                                "text-white/90 text-sm",
                                "focus:outline-none",
                                "placeholder:text-white/30",
                                "min-h-[60px]"
                            )}
                            style={{
                                overflow: "hidden",
                            }}
                            showRing={false}
                        />
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    <AnimatePresence>
                        {uploadedImages.length > 0 && (
                            <motion.div 
                                className="px-4 pb-3 flex gap-2 flex-wrap"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                {uploadedImages.map((image, index) => (
                                    <motion.div
                                        key={index}
                                        className="relative group"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                    >
                                        <img
                                            src={image.url}
                                            alt={`Upload ${index + 1}`}
                                            className="w-16 h-16 rounded-lg object-cover border border-white/10"
                                        />
                                        <button 
                                            onClick={() => removeAttachment(index)}
                                            className="absolute -top-2 -right-2 w-5 h-5 bg-black/80 rounded-full flex items-center justify-center text-white/80 hover:text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <XIcon className="w-3 h-3" />
                                        </button>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <motion.button
                                type="button"
                                onClick={handleAttachFile}
                                whileTap={{ scale: 0.94 }}
                                className="p-2 text-white rounded-lg relative group bg-black border border-white/30"
                                style={{
                                    boxShadow: `0 0 8px rgba(255, 255, 255, 0.15), 0 0 16px rgba(255, 255, 255, 0.08)`,
                                }}
                            >
                                {/* Subtle backlighting */}
                                <div 
                                    className="absolute inset-0 rounded-lg pointer-events-none"
                                    style={{
                                        background: `radial-gradient(circle at center, rgba(255, 255, 255, 0.08) 0%, transparent 60%)`,
                                    }}
                                />
                                <Paperclip className="w-4 h-4 relative z-10" />
                            </motion.button>
                        </div>
                        
                        <motion.button
                            type="button"
                            onClick={handleSendMessage}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={isTyping || (!value.trim() && uploadedImages.length === 0)}
                            className={cn(
                                "px-4 py-2 rounded-lg text-sm font-medium transition-all relative",
                                "flex items-center gap-2",
                                (value.trim() || uploadedImages.length > 0)
                                    ? "bg-black border border-white/30 text-white"
                                    : "bg-black/50 border border-white/20 text-white/40"
                            )}
                            style={{
                                boxShadow: (value.trim() || uploadedImages.length > 0)
                                    ? `0 0 12px rgba(255, 255, 255, 0.2), 0 0 24px rgba(255, 255, 255, 0.1)`
                                    : `0 0 6px rgba(255, 255, 255, 0.1), 0 0 12px rgba(255, 255, 255, 0.05)`,
                            }}
                        >
                            {/* Subtle backlighting */}
                            {(value.trim() || uploadedImages.length > 0) && (
                                <div 
                                    className="absolute inset-0 rounded-lg pointer-events-none"
                                    style={{
                                        background: `radial-gradient(circle at center, rgba(255, 255, 255, 0.1) 0%, transparent 60%)`,
                                    }}
                                />
                            )}
                            {isTyping ? (
                                <LoaderIcon className="w-4 h-4 animate-[spin_2s_linear_infinite] relative z-10" />
                            ) : (
                                <SendIcon className="w-4 h-4 relative z-10" />
                            )}
                            <span className="relative z-10">Send</span>
                        </motion.button>
                    </div>
                    </div>
                </motion.div>

                <div className="relative flex flex-wrap items-center justify-center gap-2">
                    {commandSuggestions.map((suggestion, index) => {
                        const isAnalyzeButton = suggestion.prefix === "/analyze";
                        return (
                            <motion.button
                                key={suggestion.prefix}
                                onClick={() => selectCommandSuggestion(index)}
                                className="flex items-center gap-2 px-3 py-2 bg-black border border-white/30 rounded-lg text-sm text-white transition-all relative group"
                                style={{
                                    boxShadow: `0 0 8px rgba(255, 255, 255, 0.15), 0 0 16px rgba(255, 255, 255, 0.08)`,
                                }}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                {/* Subtle backlighting */}
                                <div 
                                    className="absolute inset-0 rounded-lg pointer-events-none"
                                    style={{
                                        background: `radial-gradient(circle at center, rgba(255, 255, 255, 0.08) 0%, transparent 60%)`,
                                    }}
                                />
                                <span className="relative z-10">{suggestion.icon}</span>
                                <span className="relative z-10">{suggestion.label}</span>
                                
                            </motion.button>
                        );
                    })}
                </div>
            </motion.div>

            {inputFocused && (
                <motion.div 
                    className="fixed w-[50rem] h-[50rem] rounded-full pointer-events-none z-0 opacity-[0.02] bg-gradient-to-r from-white via-gray-400 to-white blur-[96px]"
                    animate={{
                        x: mousePosition.x - 400,
                        y: mousePosition.y - 400,
                    }}
                    transition={{
                        type: "spring",
                        damping: 25,
                        stiffness: 150,
                        mass: 0.5,
                    }}
                />
            )}

            {/* Loading Circle Animation - positioned at bottom center */}
            <AnimatePresence>
                {isTyping && (
                    <motion.div 
                        className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
                        style={{ marginLeft: "-25px" }}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                    >
                        <motion.div
                            className="w-8 h-8 border-2 border-white/30 rounded-full border-t-white"
                            animate={{ rotate: 360 }}
                            transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: "linear",
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function TypingDots() {
    return (
        <div className="flex items-center ml-1">
            {[1, 2, 3].map((dot) => (
                <motion.div
                    key={dot}
                    className="w-1.5 h-1.5 bg-white/90 rounded-full mx-0.5"
                    initial={{ opacity: 0.3 }}
                    animate={{ 
                        opacity: [0.3, 0.9, 0.3],
                        scale: [0.85, 1.1, 0.85]
                    }}
                    transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: dot * 0.15,
                        ease: "easeInOut",
                    }}
                    style={{
                        boxShadow: "0 0 4px rgba(255, 255, 255, 0.3)"
                    }}
                />
            ))}
        </div>
    );
}

