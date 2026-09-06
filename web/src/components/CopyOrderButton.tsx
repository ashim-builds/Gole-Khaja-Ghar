"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyOrderButtonProps {
  orderText: string;
}

export default function CopyOrderButton({ orderText }: CopyOrderButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(orderText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text", err);
    }
  };

  return (
    <button 
      onClick={handleCopy}
      className="flex items-center justify-center gap-2 w-full py-4 bg-white border border-stone-200 rounded-xl font-bold text-stone-700 hover:bg-stone-50 transition-colors shadow-sm"
    >
      {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
      {copied ? "Copied!" : "Copy Details"}
    </button>
  );
}
