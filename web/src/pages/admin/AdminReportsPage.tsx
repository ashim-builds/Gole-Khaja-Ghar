import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  UtensilsCrossed,
  Truck,
  RotateCcw,
  CreditCard,
  QrCode,
  Banknote,
  Award,
  Calendar,
} from "lucide-react";
import { api } from "@/lib/api";

export default function AdminReportsPage() {
  const [summary, setSummary] = useState<any | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [sumRes, chartRes] = await Promise.all([
        api.reports.getDailySummary(),
        api.reports.getSalesAnalytics(days),
      ]);

      if (sumRes.success) setSummary(sumRes.summary);
      if (chartRes.success) setChartData(chartRes.chartData);
    } catch (err) {
      console.error("Failed to load reports", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [days]);

  const maxChartRevenue = Math.max(...chartData.map((d) => d.revenue), 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-7 h-7 text-primary" />
            Sales & Revenue Analytics
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Real-time insights across dine-in POS, online delivery, tender methods, and top khaja items.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  days === d
                    ? "bg-stone-900 text-white shadow"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                Last {d} Days
              </button>
            ))}
          </div>
          <button
            onClick={fetchReports}
            className="p-2.5 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl text-stone-600 transition-colors shadow-sm"
            title="Refresh"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading && !summary ? (
        <div className="text-center py-20 text-stone-400 font-bold">Loading analytics...</div>
      ) : (
        <>
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-stone-400">Today's Revenue</span>
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                  Rs.
                </div>
              </div>
              <div className="text-3xl font-black text-stone-900">
                Rs. {summary?.totalRevenueToday?.toFixed(0) || "0"}
              </div>
              <p className="text-xs text-stone-500">From {summary?.totalOrdersToday || 0} total orders today</p>
            </div>

            {/* Dine-In Revenue */}
            <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-stone-400">Dine-In (POS)</span>
                <div className="w-9 h-9 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-stone-900">
                Rs. {summary?.dineInRevenue?.toFixed(0) || "0"}
              </div>
              <p className="text-xs text-stone-500">{summary?.dineInOrders || 0} table dining sessions</p>
            </div>

            {/* Online Delivery Revenue */}
            <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-stone-400">Online Delivery</span>
                <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-stone-900">
                Rs. {summary?.deliveryRevenue?.toFixed(0) || "0"}
              </div>
              <p className="text-xs text-stone-500">{summary?.deliveryOrders || 0} website / app orders</p>
            </div>

            {/* Live Floor & Kitchen Status */}
            <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-stone-400">Live Status</span>
                <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg font-black text-stone-900 space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Occupied Tables:</span>
                  <span className="text-amber-600 font-bold">
                    {summary?.occupiedTables || 0} / {summary?.totalTables || 0}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Active Kitchen KOTs:</span>
                  <span className="text-orange-600 font-bold">{summary?.activeKotsCount || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Chart & Tender Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Revenue Trend Visual Bar Chart */}
            <div className="lg:col-span-8 bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-stone-900">Revenue Trend (Last {days} Days)</h3>
                  <p className="text-xs text-stone-400">Daily revenue collections from payments</p>
                </div>
                <Calendar className="w-4 h-4 text-stone-400" />
              </div>

              <div className="h-64 flex items-end gap-2 pt-8 pb-2 border-b border-stone-100">
                {chartData.map((item, idx) => {
                  const heightPercent = Math.max(8, (item.revenue / maxChartRevenue) * 100);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <div className="text-[10px] font-bold text-stone-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Rs. {item.revenue}
                      </div>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full max-w-[36px] bg-primary/80 group-hover:bg-primary rounded-t-xl transition-all shadow-sm relative"
                      />
                      <span className="text-[10px] font-bold text-stone-400 truncate max-w-[45px]">
                        {item.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Methods Breakdown */}
            <div className="lg:col-span-4 bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-5">
              <div>
                <h3 className="text-base font-black text-stone-900">Payment Breakdown</h3>
                <p className="text-xs text-stone-400">Distribution by settlement method</p>
              </div>

              <div className="space-y-3">
                {summary?.paymentBreakdown && Object.keys(summary.paymentBreakdown).length > 0 ? (
                  Object.entries(summary.paymentBreakdown).map(([method, amt]: [string, any]) => (
                    <div key={method} className="p-3 bg-stone-50 rounded-2xl border border-stone-100 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-700">
                          {method === "CASH" ? (
                            <Banknote className="w-4 h-4 text-emerald-600" />
                          ) : method === "FONEPAY_QR" ? (
                            <QrCode className="w-4 h-4 text-red-600" />
                          ) : (
                            <CreditCard className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        <span className="text-xs font-bold text-stone-800">{method}</span>
                      </div>
                      <span className="text-xs font-black text-stone-900">Rs. {Number(amt).toFixed(0)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-stone-400 text-xs">No payments recorded today</div>
                )}
              </div>
            </div>
          </div>

          {/* Top Selling Khaja Leaderboard */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  Top-Selling Khaja Items Today
                </h3>
                <p className="text-xs text-stone-400">Most ordered items across dine-in and delivery</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
              {(summary?.topItems || []).map((item: any, idx: number) => (
                <div key={idx} className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-stone-900 text-white text-xs font-black flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-black text-primary">{item.count} Sold</span>
                  </div>
                  <h4 className="text-xs font-black text-stone-900 line-clamp-1">{item.name}</h4>
                  <p className="text-[11px] text-stone-500">Revenue: Rs. {item.revenue?.toFixed(0)}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
