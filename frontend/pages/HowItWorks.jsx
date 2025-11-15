import React from "react";
import { Upload, Search, FileText, CheckCircle, Clock } from "lucide-react";
import RadialOrbitalTimeline from "@/components/ui/radial-orbital-timeline";

const timelineData = [
  {
    id: 1,
    title: "Upload",
    date: "Step 1",
    content: "Upload a photo of your skin condition. Our AI accepts various image formats and will automatically analyze the image.",
    category: "Upload",
    icon: Upload,
    relatedIds: [2],
    status: "completed",
    energy: 100,
  },
  {
    id: 2,
    title: "Analyze",
    date: "Step 2",
    content: "Our advanced AI analyzes your image using medical-grade algorithms trained on thousands of dermatological cases.",
    category: "Analysis",
    icon: Search,
    relatedIds: [1, 3],
    status: "in-progress",
    energy: 80,
  },
  {
    id: 3,
    title: "Results",
    date: "Step 3",
    content: "Receive instant results with detailed information about potential conditions, severity assessment, and recommendations.",
    category: "Results",
    icon: FileText,
    relatedIds: [2, 4],
    status: "pending",
    energy: 60,
  },
  {
    id: 4,
    title: "Action",
    date: "Step 4",
    content: "Get clear guidance on whether you should seek professional medical care or if self-care is appropriate.",
    category: "Action",
    icon: CheckCircle,
    relatedIds: [3, 5],
    status: "pending",
    energy: 40,
  },
  {
    id: 5,
    title: "Follow-up",
    date: "Step 5",
    content: "Track your condition over time and access your analysis history for future reference.",
    category: "Follow-up",
    icon: Clock,
    relatedIds: [4],
    status: "pending",
    energy: 20,
  },
];

export default function HowItWorks() {
  return (
    <div className="relative min-h-screen">
      <RadialOrbitalTimeline timelineData={timelineData} />
    </div>
  );
}