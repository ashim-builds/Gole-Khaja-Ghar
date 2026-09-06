import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Receipt,
  Printer,
  CreditCard,
  QrCode,
  DollarSign,
  CheckCircle2,
  RotateCcw,
  Search,
  Plus,
  Trash2,
  UtensilsCrossed,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Percent,
  Sparkles,
  Clock,
  User,
  Check,
  Banknote,
  Smartphone,
  Wallet,
} from "lucide-react";
import { api } from "@/lib/api";
import { subscribeToEvent } from "@/lib/socket";
import { useUser } from "@/context/UserContext";

interface BillPayment {
  id: string;
  amount: number;
  method: string;
  transactionReference?: string;
  createdAt: string;
}

export default function AdminBillingPage() {
  const location = useLocation();
  const { user } = useUser();
  const isStandalone = location.pathname === "/billing";
  const userRole = (user?.role || "").toUpperCase();
  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";
  const backPath = isAdmin ? "/admin" : "/";
  const backLabel = isAdmin ? "Admin" : "Home";

  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<any | null>(null);
  const [sessionDetails, setSessionDetails] = useState<any | null>(null);
  const [bill, setBill] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // Billing calculation adjustments
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Payment Recording State
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [cashTendered, setCashTendered] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "FONEPAY_QR" | "ESEWA" | "KHALTI" | "CARD" | "OTHER"
  >("CASH");
  const [txRef, setTxRef] = useState<string>("");
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [successNotice, setSuccessNotice] = useState("");

  // FonePay QR Modal
  const [showQrModal, setShowQrModal] = useState(false);

  const fetchTablesAndBills = async () => {
    try {
      setLoading(true);
      const res = await api.tables.list();
      if (res.success) {
        setTables(res.tables.filter((t: any) => t.activeSession));
      }
    } catch (err) {
      console.error("Failed to load tables for billing", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTablesAndBills();

    const unsubTable = subscribeToEvent("table:updated", () => {
      fetchTablesAndBills();
    });
    const unsubOrder = subscribeToEvent("order:status_changed", () => {
      fetchTablesAndBills();
    });
    const unsubPayment = subscribeToEvent("payment:recorded", () => {
      fetchTablesAndBills();
    });
    const unsubKot = subscribeToEvent("kot:status_changed", () => {
      fetchTablesAndBills();
    });

    const interval = setInterval(fetchTablesAndBills, 8000);

    return () => {
      unsubTable();
      unsubOrder();
      unsubPayment();
      unsubKot();
      clearInterval(interval);
    };
  }, []);

  const handleSelectTable = async (table: any) => {
    setSelectedTable(table);
    setSuccessNotice("");
    setDiscountPercent(0);
    setDiscountAmount(0);
    setTaxAmount(0);
    setCashTendered("");

    try {
      setLoading(true);
      const res = await api.pos.getSessionDetails(table.activeSession.id);
      if (res.success) {
        setSessionDetails(res.session);

        // Generate or load bill
        const billRes = await api.billing.generate({
          tableSessionId: table.activeSession.id,
          discountAmount: 0,
          taxAmount: 0,
        });

        if (billRes.success) {
          setBill(billRes.bill);
          const totalPaid = (billRes.bill.payments || []).reduce(
            (sum: number, p: any) => sum + Number(p.amount),
            0
          );
          const balance = Math.max(0, Number(billRes.bill.netAmount) - totalPaid);
          setPaymentAmount(balance > 0 ? String(balance) : "");
          setCashTendered(balance > 0 ? String(balance) : "");
        }
      }
    } catch (err) {
      console.error("Failed to load table session billing", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAdjustments = async (disc?: number, tax?: number) => {
    if (!selectedTable?.activeSession) return;
    const finalDisc = disc !== undefined ? disc : Number(discountAmount) || 0;
    const finalTax = tax !== undefined ? tax : Number(taxAmount) || 0;

    try {
      const billRes = await api.billing.generate({
        tableSessionId: selectedTable.activeSession.id,
        discountAmount: finalDisc,
        taxAmount: finalTax,
      });
      if (billRes.success) {
        setBill(billRes.bill);
        const totalPaid = (billRes.bill.payments || []).reduce(
          (sum: number, p: any) => sum + Number(p.amount),
          0
        );
        const balance = Math.max(0, Number(billRes.bill.netAmount) - totalPaid);
        setPaymentAmount(balance > 0 ? String(balance) : "");
        setCashTendered(balance > 0 ? String(balance) : "");
      }
    } catch (err) {
      console.error("Failed to recalculate bill", err);
    }
  };

  const handlePercentDiscount = (percent: number) => {
    setDiscountPercent(percent);
    if (!bill) return;
    const gross = Number(bill.grossAmount) || 0;
    const calculated = Math.round((gross * percent) / 100);
    setDiscountAmount(calculated);
    handleApplyAdjustments(calculated, taxAmount);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bill || !paymentAmount || Number(paymentAmount) <= 0) return;

    try {
      setRecordingPayment(true);
      const res = await api.billing.recordPayment({
        billId: bill.id,
        amount: Number(paymentAmount),
        method: paymentMethod,
        transactionReference: txRef,
      });

      if (res.success) {
        setBill(res.updatedBill);
        setTxRef("");
        if (res.balanceRemaining <= 0) {
          setSuccessNotice("Bill settled in full! Table is now ready & free.");
          setPaymentAmount("");
          setCashTendered("");
          fetchTablesAndBills();
        } else {
          setSuccessNotice(`Partial payment recorded! Rs. ${res.balanceRemaining} balance remaining.`);
          setPaymentAmount(String(res.balanceRemaining));
          setCashTendered(String(res.balanceRemaining));
        }
      }
    } catch (err: any) {
      alert(err.message || "Failed to record payment");
    } finally {
      setRecordingPayment(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const totalPaid = (bill?.payments || []).reduce(
    (sum: number, p: any) => sum + Number(p.amount),
    0
  );
  const balanceRemaining = bill ? Math.max(0, Number(bill.netAmount) - totalPaid) : 0;
  const changeToReturn =
    paymentMethod === "CASH" && Number(cashTendered) > Number(paymentAmount)
      ? Number(cashTendered) - Number(paymentAmount)
      : 0;

  // Flatten all items across all session orders for receipt
  const receiptItems: any[] = [];
  if (sessionDetails?.orders) {
    sessionDetails.orders.forEach((ord: any) => {
      ord.items.forEach((it: any) => {
        receiptItems.push(it);
      });
    });
  }

  return (
    <div
      className={`space-y-6 ${
        isStandalone
          ? "min-h-screen bg-stone-100/70 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto"
          : ""
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {isStandalone && (
            <Link
              to={backPath}
              className="p-2.5 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl text-stone-700 transition-colors flex items-center gap-1.5 text-xs font-bold shadow-sm"
              title={`Back to ${backLabel}`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{backLabel}</span>
            </Link>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
              <Receipt className="w-7 h-7 text-orange-600" />
              Cashier & Table Billing
            </h1>
            <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
              Generate itemized tax invoices, record split payments, and print 80mm receipts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/pos"
            className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <UtensilsCrossed className="w-4 h-4 text-orange-400" />
            <span>POS Terminal</span>
          </Link>
          <button
            onClick={fetchTablesAndBills}
            className="p-2.5 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl text-stone-600 transition-colors shadow-sm cursor-pointer"
            title="Refresh tables"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Left Table Selector, Right Billing Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Occupied Tables ready for Billing */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black uppercase tracking-wider text-stone-500">
              Tables Ready for Billing ({tables.length})
            </span>
          </div>

          {loading && tables.length === 0 ? (
            <div className="text-center py-12 text-stone-400 font-bold text-xs">Loading active tables...</div>
          ) : tables.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-stone-200 space-y-2">
              <UtensilsCrossed className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="font-bold text-xs text-stone-700">No active dining tables</p>
              <p className="text-[11px] text-stone-400">All dine-in tables are currently settled or available.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {tables.map((t) => {
                const isSelected = selectedTable?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTable(t)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-stone-900 border-stone-900 text-white shadow-xl shadow-stone-900/20"
                        : "bg-white border-stone-200 hover:border-orange-500 text-stone-800 shadow-sm"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-black ${isSelected ? "text-white" : "text-stone-900"}`}>
                          {t.tableNumber}
                        </span>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          Occupied
                        </span>
                      </div>
                      <p className={`text-xs mt-1 ${isSelected ? "text-stone-300" : "text-stone-500"}`}>
                        Staff: <strong>{t.activeSession?.waiterName || "Staff"}</strong> • {t.capacity} Seats
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-base font-black ${
                          isSelected ? "text-orange-400" : "text-orange-600"
                        }`}
                      >
                        Rs. {t.activeSession?.totalAmount?.toFixed(0) || 0}
                      </span>
                      <span className={`block text-[10px] ${isSelected ? "text-stone-400" : "text-stone-400"}`}>
                        Running Bill
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Center/Right: Billing Workspace */}
        <div className="lg:col-span-8 space-y-6">
          {successNotice && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {selectedTable && bill ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Side: Payment & Discount Controls (5 cols) */}
              <div className="md:col-span-6 bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-sm space-y-5">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-stone-400 block mb-2">
                    Settlement - Table {selectedTable.tableNumber}
                  </span>

                  {/* Financial Breakdown */}
                  <div className="space-y-2 text-xs bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                    <div className="flex justify-between text-stone-600">
                      <span>Gross Total ({receiptItems.length} items):</span>
                      <span className="font-bold text-stone-900">Rs. {Number(bill.grossAmount).toFixed(0)}</span>
                    </div>

                    {/* Quick Discount Percentages */}
                    <div className="pt-2 border-t border-stone-200">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-stone-600 font-bold">Quick Discount:</span>
                        <span className="text-orange-600 font-bold">
                          {discountAmount > 0 ? `- Rs. ${discountAmount}` : "None"}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[0, 5, 10, 15].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => handlePercentDiscount(pct)}
                            className={`py-1 rounded-lg text-xs font-black transition-all cursor-pointer border ${
                              discountPercent === pct && (pct === 0 ? discountAmount === 0 : true)
                                ? "bg-orange-600 text-white border-orange-600 shadow-sm"
                                : "bg-white text-stone-700 border-stone-200 hover:bg-stone-100"
                            }`}
                          >
                            {pct === 0 ? "0%" : `${pct}%`}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-200 flex justify-between text-base font-black text-stone-900">
                      <span>Net Payable:</span>
                      <span className="text-orange-600 text-lg">Rs. {Number(bill.netAmount).toFixed(0)}</span>
                    </div>

                    <div className="flex justify-between text-xs text-stone-500">
                      <span>Paid so far:</span>
                      <span className="font-bold text-emerald-600">Rs. {totalPaid.toFixed(0)}</span>
                    </div>

                    <div className="flex justify-between text-xs font-black pt-1 border-t border-stone-200">
                      <span>Balance Due:</span>
                      <span className={balanceRemaining > 0 ? "text-red-500 text-sm" : "text-emerald-600 text-sm"}>
                        Rs. {balanceRemaining.toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Record Payment Form */}
                <form onSubmit={handleRecordPayment} className="space-y-4">
                  <span className="text-xs font-black uppercase tracking-wider text-stone-700 block">
                    Record Tender / Payment
                  </span>

                  <div>
                    <label className="block text-xs font-bold text-stone-600 mb-1.5">Select Payment Method</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "CASH", label: "Cash", icon: Banknote, color: "text-emerald-600" },
                        { id: "FONEPAY_QR", label: "FonePay", icon: QrCode, color: "text-red-500" },
                        { id: "ESEWA", label: "eSewa", icon: Smartphone, color: "text-emerald-500" },
                        { id: "KHALTI", label: "Khalti", icon: Wallet, color: "text-purple-600" },
                        { id: "CARD", label: "Card", icon: CreditCard, color: "text-blue-600" },
                        { id: "OTHER", label: "Other", icon: Receipt, color: "text-stone-500" },
                      ].map((m) => {
                        const Icon = m.icon;
                        const isSelected = paymentMethod === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              setPaymentMethod(m.id as any);
                              if (m.id === "FONEPAY_QR") setShowQrModal(true);
                            }}
                            className={`py-2 px-2 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              isSelected
                                ? "bg-orange-600 border-orange-600 text-white shadow-md shadow-orange-600/20 font-black"
                                : "bg-stone-50 border-stone-200 text-stone-700 hover:border-stone-300"
                            }`}
                          >
                            <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : m.color}`} />
                            <span>{m.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-600 mb-1.5">Amount to Settle (Rs.)</label>
                    <input
                      type="number"
                      required
                      value={paymentAmount}
                      onChange={(e) => {
                        setPaymentAmount(e.target.value);
                        setCashTendered(e.target.value);
                      }}
                      placeholder="e.g. 500"
                      className="w-full border border-stone-300 rounded-xl px-3.5 py-2.5 text-base font-black text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* Cash Change Calculator (only for Cash) */}
                  {paymentMethod === "CASH" && (
                    <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-stone-700">Customer Cash Given (Rs.):</label>
                        <input
                          type="number"
                          value={cashTendered}
                          onChange={(e) => setCashTendered(e.target.value)}
                          className="w-24 text-right bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-black text-stone-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>

                      {/* Quick Cash Buttons */}
                      <div className="flex gap-1.5 flex-wrap">
                        {[
                          { label: "Exact", val: Number(paymentAmount) },
                          { label: "Rs. 500", val: 500 },
                          { label: "Rs. 1000", val: 1000 },
                          { label: "Rs. 2000", val: 2000 },
                        ].map((btn, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setCashTendered(String(btn.val))}
                            className="px-2 py-0.5 bg-white hover:bg-stone-100 border border-stone-200 rounded text-[10px] font-bold text-stone-700 cursor-pointer shadow-2xs"
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>

                      {changeToReturn > 0 && (
                        <div className="flex justify-between items-center pt-1 border-t border-amber-200 text-xs font-black text-emerald-700">
                          <span>Return Change:</span>
                          <span className="text-sm bg-emerald-100 px-2 py-0.5 rounded-md">
                            Rs. {changeToReturn.toFixed(0)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-stone-600 mb-1">Tx Reference / Code (Optional)</label>
                    <input
                      type="text"
                      value={txRef}
                      onChange={(e) => setTxRef(e.target.value)}
                      placeholder="e.g. FonePay Ref ID or note"
                      className="w-full border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={recordingPayment || Number(paymentAmount) <= 0}
                    className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-orange-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {recordingPayment ? "Saving Payment..." : "Confirm & Settle Payment"}
                  </button>
                </form>
              </div>

              {/* Right Side: Attractive Thermal 80mm Receipt Preview (6 cols) */}
              <div className="md:col-span-6 bg-stone-100 rounded-3xl border border-stone-200 p-4 sm:p-6 shadow-inner flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                    <span className="text-xs font-black uppercase tracking-wider text-stone-500">
                      80mm Tax Invoice & Receipt
                    </span>
                    <button
                      onClick={handlePrintReceipt}
                      className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer transition-transform active:scale-95"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print Receipt
                    </button>
                  </div>

                  {/* HIGH AESTHETIC THERMAL RECEIPT CONTAINER */}
                  <div
                    id="receipt-print-area"
                    className="mt-4 p-5 bg-white rounded-2xl shadow-xl border border-stone-200/80 font-mono text-[11px] text-stone-800 space-y-3 relative overflow-hidden"
                  >
                    {/* Top Watermark / Status Badge */}
                    <div className="flex justify-between items-center pb-2 border-b border-stone-200">
                      <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">
                        TAX INVOICE
                      </span>
                      {balanceRemaining <= 0 ? (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
                          PAID IN FULL
                        </span>
                      ) : (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full border border-amber-300">
                          UNPAID BALANCE
                        </span>
                      )}
                    </div>

                    {/* Restaurant Header */}
                    <div className="text-center space-y-1 pb-3 border-b border-dashed border-stone-300">
                      <div className="w-10 h-10 mx-auto rounded-full bg-stone-900 border border-orange-500/30 overflow-hidden flex items-center justify-center mb-1">
                        <img src="/images/logo.png" alt="Gole Khaja Ghar" className="w-full h-full object-cover" />
                      </div>
                      <h2 className="text-base font-black tracking-tight text-stone-900 uppercase">
                        GOLE KHAJA GHAR
                      </h2>
                      <p className="text-[10px] text-stone-600 font-semibold">
                        Authentic Nepali Khaja & Restaurant
                      </p>
                      <p className="text-[9px] text-stone-500">
                        Kathmandu, Nepal • Ph: +977 9865311559
                      </p>
                      <p className="text-[9px] font-bold text-stone-700">
                        PAN / VAT No: 601982345
                      </p>
                    </div>

                    {/* Invoice Metadata */}
                    <div className="text-[10px] text-stone-600 space-y-1 border-b border-dashed border-stone-300 pb-2">
                      <div className="flex justify-between">
                        <span>Invoice No:</span>
                        <strong className="text-stone-900 font-mono">{bill.billNumber}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Table / Type:</span>
                        <strong className="text-stone-900">{selectedTable.tableNumber} (Dine-In)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Date & Time:</span>
                        <span>
                          {new Date(bill.createdAt).toLocaleDateString()}{" "}
                          {new Date(bill.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Server / Waiter:</span>
                        <span>{selectedTable.activeSession?.waiterName || "Staff"}</span>
                      </div>
                    </div>

                    {/* Itemized Table */}
                    <div className="space-y-1.5 border-b border-dashed border-stone-300 pb-3">
                      <div className="grid grid-cols-12 font-black text-stone-900 text-[10px] border-b border-stone-200 pb-1 uppercase tracking-wider">
                        <span className="col-span-1">#</span>
                        <span className="col-span-6">Item</span>
                        <span className="col-span-2 text-center">Qty</span>
                        <span className="col-span-3 text-right">Total</span>
                      </div>
                      {receiptItems.map((it, idx) => (
                        <div key={idx} className="grid grid-cols-12 text-[10px] text-stone-800 items-center py-0.5">
                          <span className="col-span-1 text-stone-400">{idx + 1}</span>
                          <span className="col-span-6 font-bold truncate pr-1">
                            {it.productName}
                            {it.variantName && <span className="text-[9px] text-stone-500 block">({it.variantName})</span>}
                          </span>
                          <span className="col-span-2 text-center text-stone-600">
                            {it.quantity} × {it.calculatedPrice}
                          </span>
                          <span className="col-span-3 text-right font-black text-stone-900">
                            Rs. {it.quantity * it.calculatedPrice}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Summary Totals */}
                    <div className="space-y-1 border-b border-dashed border-stone-300 pb-3 text-[10px]">
                      <div className="flex justify-between text-stone-600">
                        <span>Subtotal:</span>
                        <span>Rs. {Number(bill.grossAmount).toFixed(0)}</span>
                      </div>
                      {Number(bill.discountAmount) > 0 && (
                        <div className="flex justify-between text-red-600 font-bold">
                          <span>Discount Applied:</span>
                          <span>- Rs. {Number(bill.discountAmount).toFixed(0)}</span>
                        </div>
                      )}
                      {Number(bill.taxAmount) > 0 && (
                        <div className="flex justify-between text-stone-600">
                          <span>Tax / VAT (13%):</span>
                          <span>+ Rs. {Number(bill.taxAmount).toFixed(0)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-black text-stone-900 pt-2 border-t border-stone-400">
                        <span>GRAND TOTAL:</span>
                        <span className="text-base text-orange-600">Rs. {Number(bill.netAmount).toFixed(0)}</span>
                      </div>
                    </div>

                    {/* Payment Tender History */}
                    <div className="space-y-1 text-[10px] border-b border-dashed border-stone-300 pb-2">
                      <span className="font-bold text-stone-900 block uppercase text-[9px] tracking-wider">
                        Payment Summary:
                      </span>
                      {(bill.payments || []).map((p: any) => (
                        <div key={p.id} className="flex justify-between text-stone-600">
                          <span>
                            {p.method} {p.transactionReference ? `(Ref: ${p.transactionReference})` : ""}:
                          </span>
                          <span className="font-bold text-stone-900">Rs. {Number(p.amount).toFixed(0)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-bold pt-1 border-t border-stone-200">
                        <span>Total Paid:</span>
                        <span className="text-emerald-700">Rs. {totalPaid.toFixed(0)}</span>
                      </div>
                      {balanceRemaining > 0 && (
                        <div className="flex justify-between font-bold text-red-600">
                          <span>Balance Remaining:</span>
                          <span>Rs. {balanceRemaining.toFixed(0)}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Nepali Cultural Blessing & QR */}
                    <div className="text-center pt-2 space-y-1">
                      <p className="font-bold text-stone-900 text-[11px]">
                        धन्यवाद! फेरि पाल्नुहोला
                      </p>
                      <p className="text-[9px] text-stone-500">
                        Thank you for dining with us at Gole Khaja Ghar!
                      </p>
                      <div className="pt-2 flex items-center justify-center gap-2">
                        <QrCode className="w-8 h-8 text-stone-400" />
                        <span className="text-[8px] text-stone-400 text-left leading-tight">
                          Scan to View Menu<br />& Order Online
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-3">
              <Receipt className="w-12 h-12 text-stone-300 mx-auto" />
              <h3 className="text-base font-black text-stone-700">Select an Occupied Table</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Click on any table on the left to calculate invoice totals, apply percentage discounts, and record payments.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* FonePay QR Pop-up Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div>
              <h3 className="text-lg font-black text-stone-900">Scan & Pay via FonePay</h3>
              <p className="text-xs text-stone-500">Show this QR code to the customer</p>
            </div>
            <div className="w-56 bg-stone-50 p-3 rounded-2xl mx-auto border border-stone-200 shadow-inner flex flex-col items-center justify-center">
              <img
                src="/images/fonepay-qr.png"
                alt="BL GOLE KHAJA GHAR FonePay QR"
                className="w-full h-auto max-h-64 object-contain rounded-xl"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('fonepay_qr.png')) {
                    target.src = '/fonepay_qr.png';
                  }
                }}
              />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-black text-stone-900">B L GOLE KHAJA GHAR</p>
              <p className="text-[10px] text-stone-500">Terminal: 2222040019079684 • TAALCHOWK</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-2xl border border-orange-200">
              <span className="text-xs font-bold text-stone-600 block">Payable Amount:</span>
              <span className="text-xl font-black text-orange-600">Rs. {paymentAmount || "0"}</span>
            </div>
            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-all active:scale-95"
            >
              Done Scanning
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
