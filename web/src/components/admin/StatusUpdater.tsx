import React, { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { Loader2, CheckCircle2, AlertCircle, Lock } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready for Pickup / Delivery",
  delivered: "Delivered / Completed",
  cancelled: "Cancelled",
};

export default function StatusUpdater({
  orderId,
  currentStatus,
  onUpdated,
}: {
  orderId: string;
  currentStatus: string;
  onUpdated?: (newStatus: string) => void;
}) {
  const normalizedCurrent = (currentStatus || "pending").toLowerCase();
  const [selectedStatus, setSelectedStatus] = useState(normalizedCurrent);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSelectedStatus((currentStatus || "pending").toLowerCase());
  }, [currentStatus]);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  const isCancelled = selectedStatus === "cancelled";

  const showFeedback = (type: "success" | "error", message: string) => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    setFeedback({ type, message });
    feedbackTimerRef.current = setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value.toLowerCase();

    // Optimization: Don't trigger process if same status or if cancelled or if loading
    if (newStatus === selectedStatus || loading || isCancelled) {
      return;
    }

    const previousStatus = selectedStatus;

    // Immediate optimistic update so UI reflects change instantly without delay
    setSelectedStatus(newStatus);
    if (onUpdated) {
      onUpdated(newStatus);
    }

    setLoading(true);
    setFeedback(null);

    try {
      await api.orders.updateStatus(orderId, newStatus);
      const label = STATUS_LABELS[newStatus] || newStatus;
      showFeedback(
        "success",
        newStatus === "cancelled"
          ? "Order Cancelled & Locked"
          : `Status changed to ${label}`
      );
    } catch (err: any) {
      // Revert on error
      setSelectedStatus(previousStatus);
      if (onUpdated) {
        onUpdated(previousStatus);
      }
      showFeedback("error", err?.message || "Failed to update status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <div className="relative inline-flex items-center gap-2">
        <select
          value={selectedStatus}
          onChange={handleStatusChange}
          disabled={loading || isCancelled}
          title={
            isCancelled
              ? "Status is locked because the order is cancelled"
              : "Change order status"
          }
          className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm border transition-all ${
            isCancelled
              ? "bg-red-50 border-red-200 text-red-700 cursor-not-allowed opacity-90 font-black shadow-sm"
              : "bg-white border-stone-200 text-stone-700 focus:outline-none focus:ring-2 focus:ring-primary hover:border-stone-300 cursor-pointer shadow-sm disabled:opacity-50"
          }`}
        >
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready for Pickup / Delivery</option>
          <option value="delivered">Delivered / Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {loading && (
          <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
        )}

        {isCancelled && (
          <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-red-700 bg-red-100 border border-red-200 px-2 py-1 rounded-lg">
            <Lock className="w-3 h-3" /> Locked
          </span>
        )}
      </div>

      {feedback && (
        <div
          role="status"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black shadow-sm transition-all animate-in fade-in zoom-in-95 duration-200 ${
            feedback.type === "success"
              ? isCancelled
                ? "bg-red-50 border border-red-200 text-red-800"
                : "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2
              className={`w-3.5 h-3.5 ${
                isCancelled ? "text-red-600" : "text-emerald-600"
              }`}
            />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}
    </div>
  );
}

