import React from "react";
import { Clock, AlertCircle, Calendar } from "lucide-react";
import { useStoreHours } from "@/lib/storeHours";

interface StoreClosedNoticeProps {
  variant?: "banner" | "card" | "badge";
  className?: string;
}

export default function StoreClosedNotice({ variant = "banner", className = "" }: StoreClosedNoticeProps) {
  const { isOpen, isFirstTuesday, reason, nextOpening, badgeLabel } = useStoreHours();

  if (isOpen && variant !== "badge") {
    return null;
  }

  if (variant === "badge") {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black tracking-wide border ${
          isOpen
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
            : "bg-amber-500/10 text-amber-400 border-amber-500/30"
        } ${className}`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isOpen ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
          }`}
        />
        <span>{badgeLabel}</span>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={`bg-gradient-to-br from-stone-900 to-stone-950 border-2 border-amber-500/40 rounded-2xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden ${className}`}>
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400 shadow-inner">
            {isFirstTuesday ? <Calendar className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-extrabold text-lg sm:text-xl text-amber-400">
                {isFirstTuesday ? "Monthly Maintenance Day" : "Gole Khaja Ghar is Currently Closed"}
              </h3>
              <span className="text-[10px] uppercase font-black tracking-wider bg-amber-500 text-black px-2 py-0.5 rounded-md">
                Ordering Paused
              </span>
            </div>
            <p className="text-stone-300 text-sm leading-relaxed mb-3">
              {reason}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-stone-400 bg-black/40 rounded-xl p-3 border border-white/5">
              <span className="flex items-center gap-1.5 text-amber-300">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Operating Hours: 8:00 AM – 9:00 PM</span>
              </span>
              <span className="text-stone-600">•</span>
              <span className="text-stone-300">
                Next Opening: <strong className="text-white">{nextOpening}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default "banner" variant
  return (
    <div className={`w-full bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 border-y border-amber-500/30 text-amber-100 px-4 py-2.5 shadow-md ${className}`}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm text-center sm:text-left">
        <div className="flex items-center gap-2 font-bold justify-center">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            {isFirstTuesday
              ? "Closed today (1st Tuesday of every month). Online ordering will resume tomorrow at 8:00 AM."
              : "Store is currently closed. Opening hours: 8:00 AM – 9:00 PM. Reopening " + nextOpening + "."}
          </span>
        </div>
        <div className="shrink-0 font-extrabold text-[11px] uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-full">
          Ordering Disabled
        </div>
      </div>
    </div>
  );
}
