import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChefHat,
  Clock,
  CheckCircle2,
  Flame,
  Volume2,
  VolumeX,
  RotateCcw,
  ArrowLeft,
  UtensilsCrossed,
  Check,
  AlertTriangle,
  LogOut,
  Maximize2,
  Minimize2,
  User,
  Truck,
  ShoppingBag,
} from "lucide-react";
import { api } from "@/lib/api";
import { useUser } from "@/context/UserContext";
import { subscribeToEvent } from "@/lib/socket";

interface KotItem {
  id: string;
  itemName: string;
  itemDetails?: string;
  quantity: number;
  status: string;
}

interface KotTicket {
  id: string;
  ticketNumber: number;
  status: "QUEUED" | "PREPARING" | "READY" | "SERVED" | "CANCELLED";
  notes?: string;
  createdAt: string;
  tableSession?: {
    table?: { tableNumber: string };
    waiter?: { name: string; staffProfile?: { employeeCode?: string } };
  };
  order: {
    id: string;
    orderNumber: string;
    orderType: string;
    customerName: string;
  };
  items: KotItem[];
}

export default function KitchenDisplayPage() {
  const [tickets, setTickets] = useState<KotTicket[]>([]);
  const [filter, setFilter] = useState<"ALL" | "QUEUED" | "PREPARING" | "READY">("ALL");
  const [loading, setLoading] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const previousTicketCountRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const { user, logout } = useUser();
  const navigate = useNavigate();

  const playNotificationSound = () => {
    if (!audioEnabled) return;
    try {
      const ctx = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("Audio playback not permitted yet", e);
    }
  };

  const fetchTickets = async () => {
    try {
      const res = await api.kitchen.getTickets();
      if (res.success) {
        if (res.tickets.length > previousTicketCountRef.current && previousTicketCountRef.current !== 0) {
          playNotificationSound();
        }
        previousTicketCountRef.current = res.tickets.length;
        setTickets(res.tickets);
      }
    } catch (err) {
      console.error("Failed to fetch KOT tickets", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const unsubKot = subscribeToEvent("kot:status_changed", () => {
      fetchTickets();
    });
    const unsubDelivered = subscribeToEvent("order:delivered", () => {
      fetchTickets();
    });
    const interval = setInterval(fetchTickets, 5000);
    return () => {
      unsubKot();
      unsubDelivered();
      clearInterval(interval);
    };
  }, [audioEnabled]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleUpdateStatus = async (ticketId: string, nextStatus: string) => {
    try {
      const res = await api.kitchen.updateTicketStatus(ticketId, nextStatus);
      if (res.success) {
        fetchTickets();
      }
    } catch (err) {
      console.error("Failed to update KOT status", err);
    }
  };

  const handleToggleItemStatus = async (itemId: string, currentStatus: string) => {
    const next = currentStatus === "READY" ? "PENDING" : "READY";
    try {
      await api.kitchen.updateItemStatus(itemId, next);
      fetchTickets();
    } catch (err) {
      console.error("Failed to toggle item status", err);
    }
  };

  const getElapsedTimeInMinutes = (createdAt: string) => {
    const diffMs = Date.now() - new Date(createdAt).getTime();
    return Math.floor(diffMs / (1000 * 60));
  };

  const filteredTickets = tickets.filter((t) => {
    if (filter === "ALL") return true;
    return t.status === filter;
  });

  const queuedCount = tickets.filter((t) => t.status === "QUEUED").length;
  const preparingCount = tickets.filter((t) => t.status === "PREPARING").length;
  const readyCount = tickets.filter((t) => t.status === "READY").length;

  const userRole = (user?.role || "").toUpperCase();
  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";
  const backPath = isAdmin ? "/admin" : "/";
  const backLabel = isAdmin ? "Admin" : "Home";

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans select-none flex flex-col">
      {/* Top KDS Header */}
      <header className="bg-stone-900 border-b border-stone-800 px-3 sm:px-6 py-2.5 sm:py-3.5 sticky top-0 z-30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
        {/* Header Tier 1: Title & Controls */}
        <div className="flex items-center justify-between gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to={backPath}
              className="p-1.5 sm:p-2 hover:bg-stone-800 rounded-xl text-stone-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold shrink-0"
              title={`Back to ${backLabel}`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{backLabel}</span>
            </Link>
            <div className="h-5 sm:h-6 w-px bg-stone-800 shrink-0" />
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-orange-600 flex items-center justify-center text-white font-black shadow-lg shadow-orange-600/30 shrink-0">
                <ChefHat className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base md:text-lg font-black tracking-wide text-white flex items-center gap-1.5 sm:gap-2 leading-tight">
                  <span>Kitchen (KDS)</span>
                  <span className="text-[9px] sm:text-[10px] font-black uppercase px-1.5 sm:px-2 py-0.5 bg-orange-950 border border-orange-700/50 text-orange-400 rounded-full">
                    Live
                  </span>
                </h1>
                <p className="text-[10px] sm:text-[11px] text-stone-400 truncate max-w-[180px] sm:max-w-none">
                  {user ? `Chef: ${user.name}` : "Cook & Prep Screen"}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Chef Action Buttons for Mobile */}
          <div className="flex sm:hidden items-center gap-1.5">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`p-2 rounded-xl border transition-colors ${
                audioEnabled
                  ? "bg-emerald-950/60 border-emerald-700 text-emerald-400"
                  : "bg-stone-800 border-stone-700 text-stone-400"
              }`}
              title={audioEnabled ? "Audio alert on" : "Audio muted"}
            >
              {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={fetchTickets}
              className="p-2 bg-stone-800 hover:bg-stone-700 rounded-xl text-stone-300 transition-colors"
              title="Refresh queue"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            {user && (
              <button
                onClick={async () => {
                  await logout();
                  navigate("/login");
                }}
                className="p-2 bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 rounded-xl text-red-400 transition-colors"
                title="Logout Chef"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Header Tier 2: Filter Pills & Desktop Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto overflow-x-auto scrollbar-none pb-0.5 sm:pb-0">
          <div className="flex bg-stone-950 p-1 rounded-xl border border-stone-800 shrink-0">
            {(["ALL", "QUEUED", "PREPARING", "READY"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilter(mode)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  filter === mode
                    ? "bg-orange-600 text-white shadow-md shadow-orange-600/30"
                    : "text-stone-400 hover:text-white"
                }`}
              >
                {mode === "ALL" ? "All" : mode === "QUEUED" ? "Queued" : mode === "PREPARING" ? "Cooking" : "Ready"}
                {mode === "QUEUED" && queuedCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-stone-800 text-stone-300 rounded-full text-[9px] sm:text-[10px]">
                    {queuedCount}
                  </span>
                )}
                {mode === "PREPARING" && preparingCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-amber-950 text-amber-400 rounded-full text-[9px] sm:text-[10px]">
                    {preparingCount}
                  </span>
                )}
                {mode === "READY" && readyCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-emerald-950 text-emerald-400 rounded-full text-[9px] sm:text-[10px]">
                    {readyCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Desktop Only Buttons */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`p-2.5 rounded-xl border transition-colors flex items-center gap-1.5 text-xs font-bold ${
                audioEnabled
                  ? "bg-emerald-950/60 border-emerald-700 text-emerald-400"
                  : "bg-stone-800 border-stone-700 text-stone-400"
              }`}
              title={audioEnabled ? "Audio alert on" : "Audio muted"}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2.5 bg-stone-800 hover:bg-stone-700 rounded-xl text-stone-300 transition-colors"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={fetchTickets}
              className="p-2.5 bg-stone-800 hover:bg-stone-700 rounded-xl text-stone-300 transition-colors"
              title="Refresh queue"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {user && (
              <button
                onClick={async () => {
                  await logout();
                  navigate("/login");
                }}
                className="p-2.5 bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 rounded-xl text-red-400 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
                title="Logout Chef"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Tickets Queue Grid */}
      <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="text-center py-24 text-stone-500 font-bold text-xs sm:text-sm">Loading Kitchen Queue...</div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-24 sm:py-28 text-stone-500 space-y-3 px-4">
            <ChefHat className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-stone-800 animate-pulse" />
            <p className="text-base sm:text-lg font-black text-stone-400">All caught up! No active KOT tickets in queue.</p>
            <p className="text-xs text-stone-600">New orders from POS or online delivery will chime and pop up automatically.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5 sm:gap-5">
            {filteredTickets.map((ticket) => {
              const elapsed = getElapsedTimeInMinutes(ticket.createdAt);
              const isUrgent = elapsed >= 20;
              const isWarning = elapsed >= 10 && elapsed < 20;
              const orderType = (ticket.order?.orderType || "").toLowerCase();
              const isDineIn = !!ticket.tableSession || orderType === "dine_in" || orderType === "dine-in";
              const isDelivery = orderType === "delivery";
              const isPickup = orderType === "pickup";

              return (
                <div
                  key={ticket.id}
                  className={`bg-stone-900 rounded-3xl border-2 flex flex-col justify-between overflow-hidden shadow-2xl transition-all ${
                    isUrgent
                      ? "border-red-500 shadow-red-950/50 animate-pulse"
                      : isWarning
                      ? "border-amber-500 shadow-amber-950/30"
                      : ticket.status === "READY"
                      ? "border-emerald-500"
                      : "border-stone-800"
                  }`}
                >
                  {/* Ticket Header */}
                  <div
                    className={`p-4 border-b flex items-center justify-between ${
                      ticket.status === "READY"
                        ? "bg-emerald-950/40 border-emerald-800/60"
                        : ticket.status === "PREPARING"
                        ? "bg-amber-950/30 border-amber-800/50"
                        : "bg-stone-850 border-stone-800"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-white">
                          KOT #{ticket.ticketNumber}
                        </span>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            ticket.status === "READY"
                              ? "bg-emerald-500 text-black font-black"
                              : ticket.status === "PREPARING"
                              ? "bg-amber-500 text-black font-black"
                              : "bg-stone-700 text-stone-300"
                          }`}
                        >
                          {ticket.status}
                        </span>
                      </div>
                      
                      {/* Channel & Target Info */}
                      <div className="text-xs font-bold mt-1 flex items-center gap-1.5">
                        {isDelivery ? (
                          <div className="flex items-center gap-1.5 text-orange-400">
                            <Truck className="w-3.5 h-3.5 shrink-0" />
                            <span>Online Delivery • {ticket.order?.customerName || "Customer"}</span>
                          </div>
                        ) : isPickup ? (
                          <div className="flex items-center gap-1.5 text-blue-400">
                            <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                            <span>Online Pickup • {ticket.order?.customerName || "Customer"}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-amber-400">
                            <UtensilsCrossed className="w-3.5 h-3.5 shrink-0" />
                            <span>Table {ticket.tableSession?.table?.tableNumber || "Dine-In"}</span>
                            {ticket.tableSession?.waiter && (
                              <span className="text-stone-300 font-semibold text-[11px] bg-stone-800 px-2 py-0.5 rounded-full border border-stone-700">
                                Waiter: {ticket.tableSession.waiter.name}
                                {ticket.tableSession.waiter.staffProfile?.employeeCode ? ` (${ticket.tableSession.waiter.staffProfile.employeeCode})` : ""}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Timer Badge */}
                    <div
                      className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 border ${
                        isUrgent
                          ? "bg-red-500 text-white border-red-400"
                          : isWarning
                          ? "bg-amber-500 text-black border-amber-400"
                          : "bg-stone-800 text-stone-300 border-stone-700"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{elapsed}m ago</span>
                    </div>
                  </div>

                  {/* Ticket Food Items */}
                  <div className="p-4 flex-1 space-y-3">
                    <div className="space-y-2">
                      {ticket.items.map((item) => {
                        const isDone = item.status === "READY" || item.status === "SERVED";
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleToggleItemStatus(item.id, item.status)}
                            className={`p-3 rounded-2xl border flex items-start justify-between gap-3 cursor-pointer transition-all ${
                              isDone
                                ? "bg-stone-950/60 border-stone-800 text-stone-500 line-through opacity-70"
                                : "bg-stone-850 border-stone-800 hover:border-orange-500/50 text-stone-100"
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div
                                className={`w-6 h-6 rounded-lg border flex items-center justify-center text-xs font-black shrink-0 mt-0.5 transition-colors ${
                                  isDone
                                    ? "bg-emerald-600 border-emerald-500 text-white"
                                    : "border-stone-700 bg-stone-800 text-stone-400"
                                }`}
                              >
                                {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : item.quantity}
                              </div>
                              <div>
                                <h4 className="text-sm font-black tracking-tight">{item.itemName}</h4>
                                {item.itemDetails && (
                                  <p className="text-xs font-bold text-orange-400 mt-0.5">
                                    {item.itemDetails}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className="text-xs font-bold text-stone-400 shrink-0">
                              {item.quantity}x
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {ticket.notes && (
                      <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs text-amber-300 font-semibold flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span>KOT Note: {ticket.notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Ticket Workflow Action Buttons */}
                  <div className="p-4 border-t border-stone-800 bg-stone-950/50 flex gap-2">
                    {ticket.status === "QUEUED" && (
                      <button
                        onClick={() => handleUpdateStatus(ticket.id, "PREPARING")}
                        className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-600/30"
                      >
                        <Flame className="w-4 h-4" />
                        Start Cooking
                      </button>
                    )}

                    {ticket.status === "PREPARING" && (
                      <button
                        onClick={() => handleUpdateStatus(ticket.id, "READY")}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/30"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Mark as Ready
                      </button>
                    )}

                    {ticket.status === "READY" && (
                      <button
                        onClick={() => handleUpdateStatus(ticket.id, "SERVED")}
                        className="flex-1 py-3 bg-stone-800 hover:bg-stone-700 text-emerald-400 border border-emerald-500/30 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                      >
                        <Check className="w-4 h-4" />
                        Delivered to Table (Served)
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
