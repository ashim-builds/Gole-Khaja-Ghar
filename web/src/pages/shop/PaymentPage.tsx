import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  Copy,
  ArrowRight,
  ShieldCheck,
  Building2,
  Wallet,
  Banknote,
  Loader2,
  Check,
  PhoneCall,
} from "lucide-react";

interface OrderData {
  id: string;
  orderNumber: string;
  customerInfo: {
    name: string;
    phone: string;
    email?: string;
  };
  totalAmount: number;
  subtotalAmount: number;
  deliveryCharge: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    calculatedPrice: number;
    variantName?: string;
    selectedWeightInGrams?: number;
  }>;
}

export default function PaymentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<"FONEPAY_QR" | "ESEWA" | "KHALTI" | "COD">("FONEPAY_QR");
  const [txRef, setTxRef] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      if (!id) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/orders/payment/${id}`);
        const data = await res.json();
        if (data.success && data.order) {
          setOrder(data.order);
        } else {
          setError(data.error || "Order not found");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load order details");
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [id]);

  const handleCopyAccount = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/orders/payment/${order.id}/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod,
          txRef: txRef.trim(),
          amount: order.totalAmount,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPaymentSuccess(true);
        setTimeout(() => {
          navigate(`/track/${order.orderNumber}`);
        }, 2500);
      } else {
        setError(data.error || "Payment submission failed");
      }
    } catch (err: any) {
      setError(err.message || "Payment submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-orange-600 mx-auto" />
          <p className="text-sm font-bold text-stone-600">Loading payment portal...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-stone-200 text-center space-y-4 shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-black text-stone-900">Order Not Found</h2>
          <p className="text-xs text-stone-500 font-medium">{error || "Could not retrieve order details."}</p>
          <Link
            to="/shop"
            className="inline-block px-6 py-3 bg-orange-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:bg-orange-500"
          >
            Return to Menu
          </Link>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-stone-200 text-center space-y-5 shadow-xl animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-stone-900">Payment Submitted!</h2>
            <p className="text-xs text-stone-500 mt-1 font-medium leading-relaxed">
              Your FonePay payment reference for Order <strong>#{order.orderNumber}</strong> has been received. Our team will verify the payment in our bank account and confirm your order shortly.
            </p>
          </div>
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 text-xs font-bold text-stone-700 flex justify-between items-center">
            <span>Payable Amount:</span>
            <span className="text-orange-600 text-base font-black">Rs. {order.totalAmount.toFixed(0)}</span>
          </div>
          <p className="text-[11px] text-stone-400 font-semibold animate-pulse">
            Redirecting to live order tracking...
          </p>
          <Link
            to={`/track/${order.orderNumber}`}
            className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-orange-600/25"
          >
            Track Order Status <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfbfb] py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-[11px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
            Secure Payment Portal
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-stone-900 mt-2">Complete Your Payment</h1>
          <p className="text-xs sm:text-sm text-stone-500 font-medium mt-1">
            Order #{order.orderNumber} • {order.customerInfo.name} ({order.customerInfo.phone})
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Payment Options */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-stone-700 mb-3">
                1. Select Payment Method
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    id: "FONEPAY_QR",
                    label: "FonePay QR",
                    sub: "Any Bank / Mobile Banking",
                    icon: <QrCode className="w-5 h-5 text-orange-600" />,
                  },
                  {
                    id: "ESEWA",
                    label: "eSewa Wallet",
                    sub: "Direct Wallet Transfer",
                    icon: <Wallet className="w-5 h-5 text-emerald-600" />,
                  },
                  {
                    id: "KHALTI",
                    label: "Khalti Wallet",
                    sub: "Pay with Khalti ID",
                    icon: <Building2 className="w-5 h-5 text-purple-600" />,
                  },
                  {
                    id: "COD",
                    label: "Cash on Delivery",
                    sub: "Pay upon arrival",
                    icon: <Banknote className="w-5 h-5 text-stone-700" />,
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPaymentMethod(item.id as any)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                      paymentMethod === item.id
                        ? "border-orange-600 bg-orange-50/60 shadow-sm"
                        : "border-stone-200 bg-white hover:border-stone-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      {item.icon}
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === item.id ? "border-orange-600 bg-orange-600" : "border-stone-300"
                        }`}
                      >
                        {paymentMethod === item.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-xs text-stone-900">{item.label}</p>
                      <p className="text-[10px] text-stone-500 font-medium mt-0.5">{item.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* QR Code Presentation for FONEPAY / ESEWA */}
            {paymentMethod !== "COD" && (
              <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200 text-center space-y-4">
                <div className="inline-block p-3 sm:p-4 bg-white rounded-3xl shadow-md border border-stone-200">
                  {/* Authentic Bank FonePay QR visual */}
                  <div className="w-56 h-auto max-w-full bg-white flex flex-col items-center justify-center rounded-2xl overflow-hidden border border-stone-200 p-2">
                    <img
                      src="/images/fonepay-qr.png"
                      alt="BL GOLE KHAJA GHAR FonePay QR"
                      className="w-full h-auto max-h-72 object-contain rounded-xl shadow-inner"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.src.includes('fonepay_qr.png')) {
                          target.src = '/fonepay_qr.png';
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-black text-stone-900 uppercase tracking-wider">
                    Scan with any Mobile Banking, eSewa, or Khalti
                  </p>
                  <p className="text-sm font-black text-orange-600">
                    B L GOLE KHAJA GHAR
                  </p>
                  <div className="flex flex-wrap justify-center items-center gap-2 text-[11px] text-stone-600">
                    <span>Terminal: <strong className="font-mono text-stone-900">2222040019079684</strong></span>
                    <span>•</span>
                    <span>Branch: <strong className="text-stone-900">TAALCHOWK</strong></span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleCopyAccount("2222040019079684")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50 transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    {copiedAccount ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedAccount ? "Terminal Copied!" : "Copy Terminal: 2222040019079684"}</span>
                  </button>
                  <a
                    href="/images/fonepay-qr.png"
                    download="Gole-Khaja-Ghar-FonePay-QR.png"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <span>Download QR</span>
                  </a>
                </div>
              </div>
            )}

            {/* Transaction Verification Form */}
            <form onSubmit={handleConfirmPayment} className="space-y-4">
              {paymentMethod !== "COD" ? (
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Transaction ID / Reference Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={txRef}
                    onChange={(e) => setTxRef(e.target.value)}
                    placeholder="e.g. FONEPAY-981249 or eSewa Tx Code"
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-stone-50 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 text-sm font-semibold transition-all"
                  />
                  <p className="text-[10px] text-stone-400 mt-1">
                    Enter the reference code from your payment receipt to instantly verify.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 font-medium">
                  <strong>Cash on Delivery:</strong> Please keep exact change ready of{" "}
                  <strong>Rs. {order.totalAmount.toFixed(0)}</strong> when your food arrives.
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-orange-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                {submitting
                  ? "Verifying Payment..."
                  : paymentMethod === "COD"
                  ? "Confirm Cash on Delivery Order"
                  : `Submit Payment Verification (Rs. ${order.totalAmount.toFixed(0)})`}
              </button>
            </form>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <span className="text-xs font-black uppercase tracking-wider text-stone-400">Order Summary</span>
              <h3 className="text-xl font-black text-stone-900 mt-1">Rs. {order.totalAmount.toFixed(0)}</h3>
              <p className="text-xs text-stone-500 font-medium">Includes food items & delivery</p>
            </div>

            {/* Items List */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {order.items.map((it, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs pb-2 border-b border-stone-50 last:border-0">
                  <div className="space-y-0.5">
                    <p className="font-bold text-stone-900">{it.productName}</p>
                    <p className="text-[11px] text-stone-400">
                      Qty: {it.quantity} {it.variantName ? `• ${it.variantName}` : it.selectedWeightInGrams ? `• ${it.selectedWeightInGrams}g` : ""}
                    </p>
                  </div>
                  <span className="font-black text-stone-900">Rs. {Number(it.calculatedPrice).toFixed(0)}</span>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="bg-stone-50 p-4 rounded-2xl space-y-2 text-xs font-semibold text-stone-600 border border-stone-100">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="text-stone-900 font-bold">Rs. {order.subtotalAmount.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charge:</span>
                <span className="text-stone-900 font-bold">Rs. {order.deliveryCharge.toFixed(0)}</span>
              </div>
              <div className="pt-2 border-t border-stone-200 flex justify-between text-sm font-black text-stone-900">
                <span>Total Amount:</span>
                <span className="text-orange-600 text-base">Rs. {order.totalAmount.toFixed(0)}</span>
              </div>
            </div>

            {/* Need Help Box */}
            <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100 text-xs text-stone-600 space-y-1">
              <p className="font-bold text-stone-900 flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-orange-600" />
                Need help with payment?
              </p>
              <p className="text-[11px]">
                Call or WhatsApp our hotline directly at{" "}
                <a href="tel:+9779804146136" className="font-bold text-orange-700 hover:underline">9804146136</a> /{" "}
                <a href="tel:+9779846011810" className="font-bold text-orange-700 hover:underline">9846011810</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
