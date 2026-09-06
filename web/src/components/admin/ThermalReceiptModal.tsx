import React from "react";
import {
  Printer,
  X,
  QrCode,
  CheckCircle2,
  Clock,
  Ban,
  Phone,
  MapPin,
  UtensilsCrossed,
  ShoppingBag,
  Truck,
} from "lucide-react";

interface ReceiptItem {
  productName?: string;
  name?: string;
  selectedVariantName?: string;
  variantName?: string;
  selectedWeightInGrams?: number;
  qty?: number;
  quantity?: number;
  unitPriceAtTimeOfOrder?: number;
  pricePerKgAtTimeOfOrder?: number;
  calculatedPrice?: number;
  price?: number;
}

interface ThermalReceiptModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function ThermalReceiptModal({
  order,
  isOpen,
  onClose,
}: ThermalReceiptModalProps) {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const orderType = (order.orderType || "").toLowerCase();
  const isDineIn =
    orderType === "dine_in" ||
    orderType === "dine-in" ||
    order.orderSource === "WAITER" ||
    !!order.tableSessionId;

  const isPickup = orderType === "pickup";
  const isDelivery = orderType === "delivery" || (!isDineIn && !isPickup);

  const paymentStatus = (order.paymentStatus || "").toLowerCase();
  const isPaid = paymentStatus === "paid" || order.bill?.status === "PAID";
  const orderStatus = (order.status || "").toUpperCase();
  const isCancelled = orderStatus === "CANCELLED";

  const items: ReceiptItem[] = order.items || [];

  // Calculate Subtotal if not explicitly provided
  const itemsSubtotal = items.reduce((acc, item) => {
    const q = item.qty || item.quantity || 1;
    const p = item.calculatedPrice ?? ((item.unitPriceAtTimeOfOrder || item.price || 0) * q);
    return acc + Number(p);
  }, 0);

  const grandTotal = Number(order.totalAmount || order.netAmount || itemsSubtotal);
  const deliveryCharge = Number(order.deliveryFee || order.deliveryCharge || 0);
  const discountAmount = Number(order.discountAmount || 0);
  const taxAmount = Number(order.taxAmount || 0);

  const paymentMethodLabel =
    order.paymentMethod === "qr" ||
    order.paymentMethod === "fonepay_qr" ||
    order.paymentMethod === "FONEPAY_QR"
      ? "FonePay QR / Online"
      : order.paymentMethod === "card"
      ? "Card (POS)"
      : isDelivery
      ? "Cash on Delivery (COD)"
      : "Cash";

  const customerName = order.customerInfo?.name || order.customerName || "Walk-in Guest";
  const customerPhone = order.customerInfo?.phone || order.customerPhone || "";
  const address = order.deliveryAddress || order.address || "";

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-white border border-stone-200 w-full max-w-md h-[92vh] max-h-[850px] rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col justify-between relative overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-stone-700">
              80mm Tax Invoice & Receipt
            </span>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                isCancelled
                  ? "bg-red-100 text-red-800"
                  : isPaid
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {isCancelled ? "CANCELLED" : isPaid ? "PAID" : "UNPAID / COD"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer transition-transform active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print 80mm</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Area */}
        <div className="bg-stone-100 p-3 sm:p-4 my-2.5 rounded-2xl flex-1 min-h-0 overflow-y-auto flex flex-col items-center">
          {/* HIGH AESTHETIC THERMAL 80MM RECEIPT */}
          <div
            id="receipt-print-area"
            className="w-full max-w-[340px] bg-white p-5 rounded-2xl shadow-xl border border-stone-200/90 font-mono text-[11px] text-stone-900 space-y-3 relative mb-6 shrink-0"
          >
            {/* Top Watermark / Status Header */}
            <div className="flex justify-between items-center pb-2 border-b border-stone-200">
              <span className="text-[9px] font-black uppercase tracking-widest text-stone-500">
                {isCancelled ? "VOID / CANCELLED" : isPaid ? "TAX INVOICE" : "PROVISIONAL BILL / ESTIMATE"}
              </span>
              {isCancelled ? (
                <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-red-100 text-red-800 rounded-full border border-red-300 flex items-center gap-1">
                  <Ban className="w-2.5 h-2.5" /> VOID
                </span>
              ) : isPaid ? (
                <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" /> PAID IN FULL
                </span>
              ) : (
                <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full border border-amber-300 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> DUE UPON DELIVERY
                </span>
              )}
            </div>

            {/* Restaurant Header */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-stone-300">
              <div className="w-10 h-10 mx-auto rounded-full bg-stone-900 border border-orange-500/30 overflow-hidden flex items-center justify-center mb-1">
                <img
                  src="/images/logo.png"
                  alt="Gole Khaja Ghar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/favicon-circle.png";
                  }}
                />
              </div>
              <h2 className="text-base font-black tracking-tight text-stone-900 uppercase">
                GOLE KHAJA GHAR
              </h2>
              <p className="text-[10px] text-stone-600 font-semibold">
                Authentic Nepali Khaja & Restaurant
              </p>
              <p className="text-[9px] text-stone-500">
                Sisuwa, Pokhara-29, Nepal • Ph: +977 984-6011810
              </p>
              <p className="text-[9px] font-bold text-stone-700">
                PAN / VAT No: 601982345
              </p>
            </div>

            {/* Order & Customer Metadata */}
            <div className="text-[10px] text-stone-600 space-y-1 border-b border-dashed border-stone-300 pb-2.5">
              <div className="flex justify-between">
                <span>Invoice / Order:</span>
                <strong className="text-stone-900 font-mono">
                  {order.billNumber || `#${order.orderNumber}`}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Channel / Type:</span>
                <strong className="text-stone-900">
                  {isDineIn
                    ? `Dine-In (${order.tableNumber ? `Table ${order.tableNumber}` : "Table"})`
                    : isPickup
                    ? "Online Pickup"
                    : "Online Delivery"}
                </strong>
              </div>
              {(order.waiterName || order.tableSession?.waiter?.user?.fullName || order.tableSession?.waiterName) && (
                <div className="flex justify-between">
                  <span>Server / Waiter:</span>
                  <strong className="text-stone-900">
                    {order.waiterName || order.tableSession?.waiter?.user?.fullName || order.tableSession?.waiterName}
                    {order.waiterCode || order.tableSession?.waiter?.employeeCode ? ` (${order.waiterCode || order.tableSession?.waiter?.employeeCode})` : ""}
                  </strong>
                </div>
              )}
              <div className="flex justify-between">
                <span>Date & Time:</span>
                <span>
                  {order.createdAt
                    ? `${new Date(order.createdAt).toLocaleDateString()} ${new Date(
                        order.createdAt
                      ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="font-bold text-stone-900 truncate max-w-[170px]">
                  {customerName}
                </span>
              </div>
              {customerPhone && (
                <div className="flex justify-between">
                  <span>Phone:</span>
                  <span className="font-mono text-stone-800">{customerPhone}</span>
                </div>
              )}
              {address && isDelivery && (
                <div className="pt-0.5 text-[9px] text-stone-500">
                  <span className="font-bold text-stone-700">Address:</span> {address}
                </div>
              )}
            </div>

            {/* Itemized Table */}
            <div className="space-y-1.5 border-b border-dashed border-stone-300 pb-3">
              <div className="grid grid-cols-12 font-black text-stone-900 text-[10px] border-b border-stone-200 pb-1 uppercase tracking-wider">
                <span className="col-span-1">#</span>
                <span className="col-span-6">Item</span>
                <span className="col-span-2 text-center">Qty</span>
                <span className="col-span-3 text-right">Total</span>
              </div>
              {items.map((it, idx) => {
                const qty = it.qty || it.quantity || 1;
                const unitPrice =
                  it.unitPriceAtTimeOfOrder ||
                  it.price ||
                  (it.calculatedPrice ? it.calculatedPrice / qty : 0);
                const lineTotal = it.calculatedPrice ?? qty * unitPrice;
                const weightLabel = it.selectedWeightInGrams
                  ? it.selectedWeightInGrams >= 1000
                    ? `${it.selectedWeightInGrams / 1000}kg`
                    : `${it.selectedWeightInGrams}g`
                  : "";
                const variantLabel = it.selectedVariantName || it.variantName || weightLabel;

                return (
                  <div
                    key={idx}
                    className="grid grid-cols-12 text-[10px] text-stone-800 items-center py-0.5"
                  >
                    <span className="col-span-1 text-stone-400">{idx + 1}</span>
                    <span className="col-span-6 font-bold truncate pr-1">
                      {it.productName || it.name}
                      {variantLabel && (
                        <span className="text-[9px] text-stone-500 block font-normal">
                          ({variantLabel})
                        </span>
                      )}
                    </span>
                    <span className="col-span-2 text-center text-stone-600">
                      {qty} × {Number(unitPrice).toFixed(0)}
                    </span>
                    <span className="col-span-3 text-right font-black text-stone-900">
                      Rs. {Number(lineTotal).toFixed(0)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Summary Totals */}
            <div className="space-y-1 border-b border-dashed border-stone-300 pb-3 text-[10px]">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal:</span>
                <span>Rs. {itemsSubtotal.toFixed(0)}</span>
              </div>
              {deliveryCharge > 0 && (
                <div className="flex justify-between text-stone-600">
                  <span>Delivery Charge:</span>
                  <span>+ Rs. {deliveryCharge.toFixed(0)}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between text-red-600 font-bold">
                  <span>Discount:</span>
                  <span>- Rs. {discountAmount.toFixed(0)}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between text-stone-600">
                  <span>Tax / VAT:</span>
                  <span>+ Rs. {taxAmount.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-black text-stone-900 pt-2 border-t border-stone-400">
                <span>GRAND TOTAL:</span>
                <span className="text-sm text-orange-600">
                  Rs. {grandTotal.toFixed(0)}
                </span>
              </div>
            </div>

            {/* Payment & Settlement Summary */}
            <div className="space-y-1 text-[10px] border-b border-dashed border-stone-300 pb-2">
              <span className="font-bold text-stone-900 block uppercase text-[9px] tracking-wider">
                Payment Info:
              </span>
              <div className="flex justify-between text-stone-600">
                <span>Payment Mode:</span>
                <span className="font-bold text-stone-900">{paymentMethodLabel}</span>
              </div>
              {order.txRef && (
                <div className="flex justify-between text-stone-600">
                  <span>Tx Reference:</span>
                  <span className="font-mono text-stone-900 font-bold">{order.txRef}</span>
                </div>
              )}
              <div className="flex justify-between font-bold pt-1 border-t border-stone-200">
                <span>Total Settled:</span>
                <span className={isPaid ? "text-emerald-700 font-black" : "text-stone-600"}>
                  Rs. {isPaid ? grandTotal.toFixed(0) : "0"}
                </span>
              </div>
              {!isPaid && !isCancelled && (
                <div className="flex justify-between font-bold text-amber-700">
                  <span>Balance Due:</span>
                  <span>Rs. {grandTotal.toFixed(0)}</span>
                </div>
              )}
            </div>

            {/* Footer & Nepali Greeting */}
            <div className="text-center pt-2 space-y-1">
              <p className="font-bold text-stone-900 text-[11px]">
                धन्यवाद! फेरि पाल्नुहोला
              </p>
              <p className="text-[9px] text-stone-500">
                Thank you for ordering with Gole Khaja Ghar!
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

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-stone-100 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-transform active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print 80mm Invoice</span>
          </button>
        </div>
      </div>
    </div>
  );
}
