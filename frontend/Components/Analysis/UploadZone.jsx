import React, { useRef, useState } from "react";
import { Upload, Camera, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UploadZone({ onFileSelect }) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      if (files[0].type.startsWith("image/")) {
        onFileSelect(files[0]);
      }
    }
  };

  const handleFileInput = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      onFileSelect(files[0]);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
        dragActive
          ? "border-white/40 bg-white/10"
          : "border-white/20 hover:border-white/40"
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Icon */}
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
        <ImageIcon className="w-10 h-10 text-white" />
      </div>

      {/* Text */}
      <h3 className="text-2xl font-semibold mb-2">Upload Skin Image</h3>
      <p className="text-gray-400 mb-8 max-w-md mx-auto">
        Drag and drop your image here, or choose from the options below
      </p>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          onClick={() => fileInputRef.current?.click()}
          className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-6"
        >
          <Upload className="w-5 h-5 mr-2" />
          Browse Files
        </Button>
        <Button
          onClick={() => cameraInputRef.current?.click()}
          variant="outline"
          className="border-white/20 hover:bg-white/10 px-8 py-6"
        >
          <Camera className="w-5 h-5 mr-2" />
          Take Photo
        </Button>
      </div>

      {/* Supported Formats */}
      <p className="text-sm text-gray-500 mt-6">
        Supported formats: JPG, PNG, HEIC • Max size: 10MB
      </p>
    </div>
  );
}