import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Loader2, CheckCircle2, Clock, Check } from "lucide-react";

export default function PaymentStatusToggle({
  orderId,
  currentPaymentStatus,
  onStatusChange,
}: {
  orderId: string;
  currentPaymentStatus: "pending" | "paid";
  onStatusChange?: (newStatus: "pending" | "paid") => void;
}) {
  const [status, setStatus] = useState<"pending" | "paid">(currentPaymentStatus || "pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (currentPaymentStatus) {
      setStatus(currentPaymentStatus);
    }
  }, [currentPaymentStatus]);

  const toggle = async () => {
    if (!orderId) return;
    const newStatus = status === "paid" ? "pending" : "paid";
    setLoading(true);
    setError("");
    try {
      const res = await api.orders.updatePayment(orderId, newStatus);
      const updatedStatus = (res?.order?.paymentStatus || newStatus) as "pending" | "paid";
      setStatus(updatedStatus);
      if (onStatusChange) {
        onStatusChange(updatedStatus);
      }
    } catch (err: any) {
      setError(err.message || "Failed to update payment status.");
    } finally {
      setLoading(false);
    }
  };

  const isPaid = status === "paid";

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-bold text-stone-400">Payment Status</p>
      <div className="flex items-center gap-3">
        {/* Badge */}
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-colors ${
            isPaid
              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
              : "bg-amber-100 text-amber-800 border border-amber-300"
          }`}
        >
          {isPaid ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          )}
          {status}
        </span>

        {/* Toggle button */}
        <button
          type="button"
          onClick={toggle}
          disabled={loading}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all disabled:opacity-50 cursor-pointer ${
            isPaid
              ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
              : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
          }`}
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : isPaid ? (
            "Mark Unpaid"
          ) : (
            <span className="flex items-center gap-1">
              Mark as Paid
              <Check className="w-3.5 h-3.5" />
            </span>
          )}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
    </div>
  );
}
