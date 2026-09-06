import React, { useState } from "react";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function StatusUpdater({ 
  orderId, 
  currentStatus, 
  onUpdated 
}: { 
  orderId: string; 
  currentStatus: string;
  onUpdated?: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLoading(true);
    try {
      await api.orders.updateStatus(orderId, e.target.value);
      if (onUpdated) {
        onUpdated();
      }
    } catch {
      alert("Failed to update status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <select
        value={currentStatus}
        onChange={handleStatusChange}
        disabled={loading}
        className="px-4 py-2 bg-white border border-stone-200 rounded-lg font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 cursor-pointer"
      >
        <option value="pending">Pending</option>
        <option value="confirmed">Confirmed</option>
        <option value="preparing">Preparing</option>
        <option value="ready">Ready for Pickup / Delivery</option>
        <option value="delivered">Delivered / Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
      {loading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
    </div>
  );
}
