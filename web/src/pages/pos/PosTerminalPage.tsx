import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UtensilsCrossed,
  Plus,
  Search,
  Clock,
  User,
  Users,
  Send,
  Receipt,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Flame,
  ArrowLeft,
  X,
  Minus,
  ChefHat,
  ShoppingBag,
  Check,
} from "lucide-react";
import { api, Product } from "@/lib/api";
import { useUser } from "@/context/UserContext";
import { subscribeToEvent, playAudioAlert } from "@/lib/socket";

interface ReadyAlert {
  id: string;
  tableNumber: string;
  ticketNumber: number;
  itemsSummary: string;
  timestamp: string;
}

interface TableData {
  id: string;
  tableNumber: string;
  capacity: number;
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED" | "OUT_OF_SERVICE";
  activeSession: {
    id: string;
    waiterName: string;
    guestCount: number;
    openedAt: string;
    totalAmount: number;
    itemCount: number;
    ordersCount: number;
    billStatus: string;
  } | null;
}

interface PosCartItem {
  cartItemId: string;
  productId: string;
  productName: string;
  variantName?: string;
  selectedWeightInGrams?: number;
  unitPrice?: number;
  pricePerKg?: number;
  calculatedPrice: number;
  quantity: number;
  specialInstructions?: string;
}

export default function PosTerminalPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [tables, setTables] = useState<TableData[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [sessionDetails, setSessionDetails] = useState<any | null>(null);
  const [loadingTables, setLoadingTables] = useState(true);
  const [readyAlerts, setReadyAlerts] = useState<ReadyAlert[]>([]);
  const [deliveringTicketId, setDeliveringTicketId] = useState<string | null>(null);

  // Products & Menu
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Mobile App Navigation
  const [mobileTab, setMobileTab] = useState<"TABLES" | "MENU" | "CART">("TABLES");
  const [tableFilter, setTableFilter] = useState<"ALL" | "FREE" | "OCCUPIED">("ALL");

  // Cart / Order Pad
  const [cartItems, setCartItems] = useState<PosCartItem[]>([]);
  const [tableNotes, setTableNotes] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState("");

  // Open Table Modal
  const [openModalTable, setOpenModalTable] = useState<TableData | null>(null);
  const [guestCount, setGuestCount] = useState(2);
  const [waiterList, setWaiterList] = useState<any[]>([]);
  const [selectedWaiterId, setSelectedWaiterId] = useState<string>("");
  const [openSessionNotes, setOpenSessionNotes] = useState("");
  const [openingSession, setOpeningSession] = useState(false);
  const [openTableError, setOpenTableError] = useState("");

  const handleOpenTableModal = (table: TableData) => {
    setOpenModalTable(table);
    setGuestCount(Math.min(2, table.capacity || 2));
    setOpenSessionNotes("");
    setOpenTableError("");

    // Auto-select current logged-in user if they are in waiter list
    const matched = waiterList.find(
      (w) => w.id === user?.id || w.id === (user as any)?._id || w.name?.toLowerCase() === user?.name?.toLowerCase()
    );
    if (matched) {
      setSelectedWaiterId(matched.id);
    } else if (waiterList.length === 1) {
      setSelectedWaiterId(waiterList[0].id);
    } else {
      setSelectedWaiterId("");
    }
  };

  const handleOpenTableSession = async () => {
    if (!openModalTable) return;
    if (!selectedWaiterId) {
      setOpenTableError("Please select an assigned Waiter to open this table session.");
      return;
    }

    try {
      setOpeningSession(true);
      setOpenTableError("");
      const res = await api.tables.openSession({
        tableId: openModalTable.id,
        waiterId: selectedWaiterId,
        guestCount,
        notes: openSessionNotes,
      });

      if (res.success) {
        setOpenModalTable(null);
        await loadInitialData();
        // Select this opened table
        const updatedTable: TableData = {
          ...openModalTable,
          status: "OCCUPIED",
          activeSession: {
            id: res.session.id,
            waiterName: res.session.waiter?.name || "Staff",
            guestCount: res.session.guestCount,
            openedAt: res.session.openedAt,
            totalAmount: 0,
            itemCount: 0,
            ordersCount: 0,
            billStatus: "UNPAID",
          },
        };
        handleSelectTable(updatedTable);
      }
    } catch (err: any) {
      setOpenTableError(err.message || "Failed to open table session");
    } finally {
      setOpeningSession(false);
    }
  };

  // Product Selection Modal (Weight/Portion Selector)
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<{ name: string; price: number } | null>(null);
  const [selectedWeightGrams, setSelectedWeightGrams] = useState<number>(500);
  const [customWeightInput, setCustomWeightInput] = useState<string>("");
  const [itemInstructions, setItemInstructions] = useState<string>("");
  const [itemQty, setItemQty] = useState<number>(1);

  // Load Tables & Products
  const loadInitialData = async () => {
    try {
      setLoadingTables(true);
      const [tablesRes, prodsRes, catsRes, waitersRes] = await Promise.all([
        api.tables.list(),
        api.products.getAll(undefined, undefined, true),
        api.products.getCategories(),
        api.admin.waiters.list().catch(() => ({ success: false, waiters: [] })),
      ]);

      if (tablesRes.success) setTables(tablesRes.tables);
      if (prodsRes.success) setProducts(prodsRes.products);
      if (catsRes.success) setCategories(["All", ...catsRes.categories]);
      if (waitersRes && "waiters" in waitersRes) setWaiterList(waitersRes.waiters);
    } catch (err) {
      console.error("Failed to load POS data:", err);
    } finally {
      setLoadingTables(false);
    }
  };

  const refreshTables = async () => {
    try {
      const res = await api.tables.list();
      if (res.success) {
        setTables(res.tables);
        if (selectedTable) {
          const updated = res.tables.find((t) => t.id === selectedTable.id);
          if (updated) {
            setSelectedTable(updated);
            if (updated.activeSession) {
              const sessRes = await api.pos.getSessionDetails(updated.activeSession.id);
              if (sessRes.success) setSessionDetails(sessRes.session);
            }
          }
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadInitialData();

    // Subscribe to live WebSocket events from Kitchen & Other Waiters
    const unsubReady = subscribeToEvent("waiter:ready_alert", (payload: any) => {
      playAudioAlert("ready");
      setReadyAlerts((prev) => [
        {
          id: payload.kotTicketId || String(Date.now()),
          tableNumber: payload.tableNumber,
          ticketNumber: payload.ticketNumber,
          itemsSummary: payload.itemsSummary || "Dishes ready",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
        ...prev.slice(0, 4),
      ]);
      refreshTables();
    });

    const unsubKot = subscribeToEvent("kot:status_changed", () => {
      refreshTables();
    });

    const unsubDelivered = subscribeToEvent("order:delivered", () => {
      refreshTables();
    });

    const unsubTable = subscribeToEvent("table:updated", () => {
      refreshTables();
    });

    const timer = setInterval(refreshTables, 15000);

    return () => {
      unsubReady();
      unsubKot();
      unsubDelivered();
      unsubTable();
      clearInterval(timer);
    };
  }, [selectedTable?.id]);

  // Mark KOT ticket as delivered / served by waiter
  const handleMarkDelivered = async (ticketId: string) => {
    try {
      setDeliveringTicketId(ticketId);
      const res = await fetch(`/api/kitchen/tickets/${ticketId}/deliver`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        playAudioAlert("chime");
        // Remove from ready alerts
        setReadyAlerts((prev) => prev.filter((a) => a.id !== ticketId));
        refreshTables();
      }
    } catch (err) {
      console.error("Failed to mark delivered", err);
    } finally {
      setDeliveringTicketId(null);
    }
  };

  // Fetch session details when a table is selected
  const handleSelectTable = async (tbl: TableData) => {
    setSelectedTable(tbl);
    setCartItems([]);
    setTableNotes("");
    setOrderSuccessMsg("");

    if (tbl.activeSession) {
      try {
        const res = await api.pos.getSessionDetails(tbl.activeSession.id);
        if (res.success) {
          setSessionDetails(res.session);
        }
      } catch (err) {
        console.error("Failed to load session details", err);
      }
    } else {
      setSessionDetails(null);
    }
  };

  // Open item customization modal
  const handleProductClick = (prod: Product) => {
    setActiveProduct(prod);
    setItemQty(1);
    setItemInstructions("");

    if (prod.priceType === "weight") {
      const defaultWeight = prod.weightOptions?.[0]?.value || 500;
      setSelectedWeightGrams(defaultWeight);
      setCustomWeightInput("");
      setSelectedVariant(null);
    } else {
      if (prod.variants && prod.variants.length > 0) {
        setSelectedVariant(prod.variants[0]);
      } else {
        setSelectedVariant({ name: "Regular / Full Plate", price: prod.pricePerKg || 0 });
      }
    }
  };

  const handleAddToCart = () => {
    if (!activeProduct) return;

    let calculatedPrice = 0;
    let variantName = undefined;
    let selectedWeightInGrams = undefined;
    let unitPrice = undefined;
    let pricePerKg = undefined;

    if (activeProduct.priceType === "weight") {
      pricePerKg = activeProduct.pricePerKg || 0;
      let finalWeight = selectedWeightGrams;
      if (customWeightInput && Number(customWeightInput) > 0) {
        finalWeight = Number(customWeightInput);
      }
      selectedWeightInGrams = finalWeight;
      calculatedPrice = Math.round((pricePerKg * finalWeight) / 1000);
      variantName = `${finalWeight}g`;
    } else {
      if (selectedVariant) {
        calculatedPrice = Number(selectedVariant.price);
        unitPrice = calculatedPrice;
        variantName = selectedVariant.name;
      } else {
        calculatedPrice = 0;
      }
    }

    const newItem: PosCartItem = {
      cartItemId: `${activeProduct.id}-${Date.now()}`,
      productId: activeProduct.id,
      productName: activeProduct.name,
      variantName,
      selectedWeightInGrams,
      unitPrice,
      pricePerKg,
      calculatedPrice,
      quantity: itemQty,
      specialInstructions: itemInstructions.trim() || undefined,
    };

    setCartItems((prev) => [...prev, newItem]);
    setActiveProduct(null);
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((it) => it.cartItemId !== cartItemId));
  };

  const handleSendToKitchen = async () => {
    if (!selectedTable || !selectedTable.activeSession) {
      alert("Please select or open an active table first.");
      return;
    }

    if (cartItems.length === 0) {
      alert("Please add at least one item before sending to kitchen.");
      return;
    }

    try {
      setSubmittingOrder(true);
      const res = await api.pos.createOrder({
        tableSessionId: selectedTable.activeSession.id,
        notes: tableNotes,
        items: cartItems.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          variantName: item.variantName,
          selectedWeightInGrams: item.selectedWeightInGrams,
          unitPrice: item.unitPrice,
          pricePerKg: item.pricePerKg,
          calculatedPrice: item.calculatedPrice,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions,
        })),
      });

      if (res.success) {
        setCartItems([]);
        setTableNotes("");
        setOrderSuccessMsg(`KOT #${res.kotTicket.ticketNumber} Sent to Kitchen!`);
        setTimeout(() => setOrderSuccessMsg(""), 5000);

        // Refresh session details & tables
        const sessionRes = await api.pos.getSessionDetails(selectedTable.activeSession.id);
        if (sessionRes.success) setSessionDetails(sessionRes.session);
        const tablesRes = await api.tables.list();
        if (tablesRes.success) setTables(tablesRes.tables);
      }
    } catch (err: any) {
      alert(err.message || "Failed to send order to kitchen");
    } finally {
      setSubmittingOrder(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const cartSubtotal = cartItems.reduce((sum, it) => sum + it.calculatedPrice * it.quantity, 0);

  const userRole = (user?.role || "").toUpperCase();
  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";
  const isChefOrAdmin = isAdmin || userRole === "CHEF" || userRole === "KITCHEN";
  const backPath = isAdmin ? "/admin" : "/";
  const backLabel = isAdmin ? "Admin" : "Home";
  const freeTablesCount = tables.filter((t) => t.status !== "OCCUPIED" || !t.activeSession).length;
  const occupiedTablesCount = tables.filter((t) => t.status === "OCCUPIED" && t.activeSession).length;

  const filteredTables = tables.filter((t) => {
    if (tableFilter === "FREE") return t.status !== "OCCUPIED" || !t.activeSession;
    if (tableFilter === "OCCUPIED") return t.status === "OCCUPIED" && t.activeSession;
    return true;
  });

  return (
    <div className="h-screen flex flex-col bg-stone-950 text-stone-100 font-sans select-none overflow-hidden">
      {/* POS Top Header (Responsive) */}
      <header className="bg-stone-900 border-b border-stone-800 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link
            to={backPath}
            className="p-1.5 sm:p-2 hover:bg-stone-800 rounded-xl text-stone-400 hover:text-white transition-colors flex items-center gap-1 text-xs sm:text-sm font-semibold shrink-0"
            title={`Back to ${backLabel}`}
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">{backLabel}</span>
          </Link>
          <div className="h-5 sm:h-6 w-px bg-stone-800 shrink-0" />
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white font-black shadow-lg shadow-orange-600/20 shrink-0">
              <UtensilsCrossed className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-black tracking-wide text-white leading-tight flex items-center gap-1.5 truncate">
                <span>Dine-In POS</span>
                <span className="text-orange-500 text-[10px] sm:text-xs font-bold uppercase px-1.5 py-0.5 bg-orange-950/80 border border-orange-700/50 rounded-full">
                  Terminal
                </span>
              </h1>
              <p className="text-[10px] sm:text-[11px] text-stone-400 hidden sm:block truncate">
                Gole Khaja Ghar Restaurant Management
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {isChefOrAdmin && (
            <Link
              to="/kitchen"
              target="_blank"
              className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-xl text-xs font-bold text-stone-200 hidden md:flex items-center gap-1.5 transition-colors"
            >
              <ChefHat className="w-3.5 h-3.5 text-orange-400" />
              <span>Kitchen Screen</span>
            </Link>
          )}
          <Link
            to="/billing"
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition-colors shadow-md shadow-amber-600/20 active:scale-95"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Billing</span>
          </Link>
          <button
            onClick={loadInitialData}
            className="p-1.5 sm:p-2 hover:bg-stone-800 rounded-xl text-stone-400 hover:text-white transition-colors cursor-pointer"
            title="Refresh tables"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile Segmented Sub-Navbar (Hidden on lg+ Desktop) */}
      <div className="lg:hidden bg-stone-900/95 border-b border-stone-800 p-1.5 flex items-center justify-around gap-1 shrink-0 z-10">
        <button
          onClick={() => setMobileTab("TABLES")}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mobileTab === "TABLES"
              ? "bg-orange-600 text-white shadow-md shadow-orange-600/30"
              : "text-stone-400 hover:text-stone-200 bg-stone-950/40"
          }`}
        >
          <UtensilsCrossed className="w-3.5 h-3.5" />
          <span>Tables ({tables.length})</span>
        </button>

        <button
          onClick={() => setMobileTab("MENU")}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mobileTab === "MENU"
              ? "bg-orange-600 text-white shadow-md shadow-orange-600/30"
              : "text-stone-400 hover:text-stone-200 bg-stone-950/40"
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>{selectedTable ? selectedTable.tableNumber : "Menu"}</span>
        </button>

        <button
          onClick={() => setMobileTab("CART")}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all relative cursor-pointer ${
            mobileTab === "CART"
              ? "bg-orange-600 text-white shadow-md shadow-orange-600/30"
              : "text-stone-400 hover:text-stone-200 bg-stone-950/40"
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Order Pad</span>
          {cartItems.length > 0 && (
            <span className="px-1.5 py-0.2 bg-white text-stone-950 rounded-full text-[10px] font-black animate-pulse">
              {cartItems.length}
            </span>
          )}
        </button>
      </div>

      {/* Real-Time Floating Ready Alerts for Waiters */}
      {readyAlerts.length > 0 && (
        <div className="bg-emerald-950/90 border-b border-emerald-600/50 px-3 sm:px-4 py-2 flex items-center justify-between gap-3 overflow-x-auto shrink-0 shadow-lg z-30">
          <div className="flex items-center gap-2 text-xs font-black text-emerald-400 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] sm:text-xs">READY FOR PICKUP:</span>
          </div>
          <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-none">
            {readyAlerts.map((alert) => {
              const tbl = alert.tableNumber || "";
              const isDirectTable = /^T-\d+/i.test(tbl) || /^\d+$/.test(tbl);
              const isOnline = tbl.toLowerCase().includes("online") || tbl.toLowerCase().includes("delivery") || tbl.toLowerCase().includes("pickup");
              const displayName = isDirectTable
                ? `Table ${tbl.replace(/^table\s*/i, "")}`
                : isOnline
                ? tbl
                : tbl === "Takeaway"
                ? "Takeaway Order"
                : tbl;

              return (
                <div
                  key={alert.id}
                  className="flex items-center gap-2 bg-emerald-900/90 border border-emerald-500/60 rounded-xl px-2.5 py-1 text-xs text-white shrink-0 shadow-md animate-pulse"
                >
                  <span className="font-black text-emerald-300 text-xs">{displayName}</span>
                  <span className="text-emerald-200/90 text-[10px] sm:text-[11px] truncate max-w-[160px] sm:max-w-[220px]">
                    ({alert.itemsSummary})
                  </span>
                  <button
                    onClick={() => handleMarkDelivered(alert.id)}
                    disabled={deliveringTicketId === alert.id}
                    className="px-2 py-0.5 bg-emerald-400 hover:bg-emerald-300 text-stone-950 font-black rounded-lg text-[9px] sm:text-[10px] uppercase transition-colors cursor-pointer"
                  >
                    {deliveringTicketId === alert.id ? "..." : "Mark Delivered"}
                  </button>
                  <button
                    onClick={() => setReadyAlerts((prev) => prev.filter((a) => a.id !== alert.id))}
                    className="text-emerald-400 hover:text-white ml-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. MOBILE APP VIEW (< 1024px) */}
      {/* ========================================================================= */}
      <div className="lg:hidden flex-1 flex flex-col overflow-hidden relative">
        {/* MOBILE TAB 1: TABLES */}
        {mobileTab === "TABLES" && (
          <div className="flex-1 flex flex-col overflow-hidden bg-stone-950">
            {/* Filter Chips Bar */}
            <div className="p-3 border-b border-stone-800/80 bg-stone-900/40 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => setTableFilter("ALL")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    tableFilter === "ALL"
                      ? "bg-stone-800 text-white border border-stone-700"
                      : "text-stone-400 hover:text-white"
                  }`}
                >
                  All ({tables.length})
                </button>
                <button
                  onClick={() => setTableFilter("FREE")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    tableFilter === "FREE"
                      ? "bg-emerald-950 border border-emerald-600 text-emerald-400"
                      : "text-stone-400 hover:text-emerald-400"
                  }`}
                >
                  🟢 Free ({freeTablesCount})
                </button>
                <button
                  onClick={() => setTableFilter("OCCUPIED")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    tableFilter === "OCCUPIED"
                      ? "bg-amber-950 border border-amber-600 text-amber-400"
                      : "text-stone-400 hover:text-amber-400"
                  }`}
                >
                  🟡 Occupied ({occupiedTablesCount})
                </button>
              </div>
            </div>

            {/* Mobile Tables List / Cards */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
              {loadingTables ? (
                <div className="text-center py-20 text-stone-500 font-bold text-xs">Loading floor tables...</div>
              ) : filteredTables.length === 0 ? (
                <div className="text-center py-20 text-stone-500 space-y-2">
                  <UtensilsCrossed className="w-10 h-10 text-stone-700 mx-auto" />
                  <p className="font-bold text-xs">No tables match filter</p>
                </div>
              ) : (
                filteredTables.map((table) => {
                  const isSelected = selectedTable?.id === table.id;
                  const isOccupied = table.status === "OCCUPIED" && table.activeSession;

                  return (
                    <div
                      key={table.id}
                      onClick={() => {
                        if (isOccupied) {
                          handleSelectTable(table);
                          setMobileTab("MENU");
                        } else {
                          handleOpenTableModal(table);
                        }
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? "bg-orange-950/40 border-orange-500 ring-1 ring-orange-500 shadow-xl"
                          : isOccupied
                          ? "bg-stone-900 border-amber-800/80 shadow-md"
                          : "bg-stone-900/70 border-stone-800 hover:border-stone-700"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-black tracking-tight text-white">{table.tableNumber}</span>
                          <span className="text-xs font-semibold text-stone-400 flex items-center gap-1 bg-stone-800/80 px-2 py-0.5 rounded-md">
                            <Users className="w-3 h-3 text-stone-500" />
                            {table.capacity} Guests
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                            isOccupied
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse"
                              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          }`}
                        >
                          {isOccupied ? "Occupied" : "Available"}
                        </span>
                      </div>

                      {isOccupied ? (
                        <div className="mt-3 space-y-2 pt-2 border-t border-stone-800/80">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-stone-400 flex items-center gap-1 font-semibold">
                              <User className="w-3.5 h-3.5 text-stone-500" />
                              Waiter: <strong className="text-white">{table.activeSession?.waiterName}</strong>
                            </span>
                            <span className="text-sm font-black text-orange-400">
                              Rs. {table.activeSession?.totalAmount.toFixed(0)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[11px] text-stone-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Seated:{" "}
                              {new Date(table.activeSession?.openedAt || "").toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate("/billing");
                                }}
                                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-black flex items-center gap-1"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                                Bill
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectTable(table);
                                  setMobileTab("MENU");
                                }}
                                className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-black flex items-center gap-1 shadow-md shadow-orange-600/30"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Order
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 pt-2 border-t border-stone-800/60 flex items-center justify-between">
                          <span className="text-[11px] text-stone-500 font-medium">Ready for new guest</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenTableModal(table);
                            }}
                            className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-black flex items-center gap-1 shadow-md shadow-orange-600/25"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Seat Guests
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* MOBILE TAB 2: MENU CATALOG */}
        {mobileTab === "MENU" && (
          <div className="flex-1 flex flex-col overflow-hidden bg-stone-950">
            {/* Top Active Table Indicator & Switcher */}
            <div className="p-2.5 bg-stone-900 border-b border-stone-800 flex items-center justify-between gap-2 shrink-0">
              {selectedTable ? (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-orange-600/20 border border-orange-500/40 text-orange-400 flex items-center justify-center font-black text-xs shrink-0">
                    {selectedTable.tableNumber}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-white truncate">
                      Ordering for Table {selectedTable.tableNumber}
                    </p>
                    <p className="text-[10px] text-stone-400 truncate">
                      {selectedTable.activeSession ? `Waiter: ${selectedTable.activeSession.waiterName}` : "Not Seated Yet"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>No Table Selected</span>
                </div>
              )}

              <button
                onClick={() => setMobileTab("TABLES")}
                className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-lg text-xs font-bold shrink-0 transition-colors border border-stone-700"
              >
                Change Table ↺
              </button>
            </div>

            {/* Menu Search & Category Filter */}
            <div className="p-2.5 border-b border-stone-800 space-y-2 bg-stone-950 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search momo, chowmein, sekuwa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Category horizontal scroll */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? "bg-orange-600 text-white shadow-md shadow-orange-600/30 font-black"
                        : "bg-stone-900 text-stone-400 hover:bg-stone-800 hover:text-stone-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile 2-Column Food Cards Grid */}
            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2.5 auto-rows-max items-start content-start custom-scrollbar pb-24">
              {filteredProducts.map((prod) => {
                const isWeight = prod.priceType === "weight";
                const hasVariants = prod.variants && prod.variants.length > 0;
                const firstVariant = hasVariants ? prod.variants![0] : null;

                const priceDisplay = isWeight
                  ? `Rs. ${prod.pricePerKg}/kg`
                  : firstVariant
                  ? `Rs. ${firstVariant.price}`
                  : `Rs. ${prod.pricePerKg || 0}`;

                const portionHint =
                  !isWeight && firstVariant
                    ? prod.variants!.length > 1
                      ? `(${prod.variants!.length} sizes)`
                      : ""
                    : "";

                return (
                  <div
                    key={prod.id}
                    onClick={() => handleProductClick(prod)}
                    className="bg-stone-900 border border-stone-800 rounded-2xl p-2.5 flex flex-col justify-between cursor-pointer transition-all active:scale-95 shadow-md select-none h-fit"
                  >
                    <div>
                      <div className="aspect-[4/3] rounded-xl overflow-hidden bg-stone-800 relative mb-2">
                        <img
                          src={prod.image || "/images/logo.png"}
                          alt={prod.name}
                          className="w-full h-full object-cover"
                        />
                        {isWeight ? (
                          <span className="absolute top-1 left-1 bg-orange-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow">
                            Weight
                          </span>
                        ) : prod.variants && prod.variants.length > 1 ? (
                          <span className="absolute top-1 left-1 bg-stone-900/90 text-amber-400 border border-amber-500/40 text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow">
                            {prod.variants.length} Sizes
                          </span>
                        ) : null}
                      </div>
                      <h3 className="font-black text-xs text-stone-100 line-clamp-1">{prod.name}</h3>
                      <p className="text-[10px] text-stone-400 line-clamp-1">{prod.category}</p>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between pt-1.5 border-t border-stone-800">
                      <div>
                        <span className="text-xs font-black text-orange-400">{priceDisplay}</span>
                        {portionHint && (
                          <span className="text-[9px] text-stone-500 block leading-tight">{portionHint}</span>
                        )}
                      </div>
                      <span className="w-6 h-6 rounded-lg bg-orange-600 text-white flex items-center justify-center text-xs font-black shadow-sm">
                        +
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Floating Mobile Bottom Order Bar */}
            {cartItems.length > 0 && (
              <div className="absolute bottom-3 left-3 right-3 z-30">
                <button
                  onClick={() => setMobileTab("CART")}
                  className="w-full bg-orange-600 hover:bg-orange-500 text-white p-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-between shadow-2xl shadow-orange-600/40 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-white text-orange-600 flex items-center justify-center text-xs font-black">
                      {cartItems.length}
                    </span>
                    <span>Order Pad Total</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-sm font-black">
                    <span>Rs. {cartSubtotal.toFixed(0)}</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        {/* MOBILE TAB 3: ORDER PAD & CART */}
        {mobileTab === "CART" && (
          <div className="flex-1 flex flex-col overflow-hidden bg-stone-950">
            {/* Table Session Details */}
            <div className="p-3 bg-stone-900 border-b border-stone-800 shrink-0">
              {selectedTable ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-white">{selectedTable.tableNumber}</span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          selectedTable.activeSession
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-400"
                        }`}
                      >
                        {selectedTable.activeSession ? "Seated Table" : "Available Table"}
                      </span>
                    </div>
                    {selectedTable.activeSession && (
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        Waiter: <strong className="text-white">{selectedTable.activeSession.waiterName}</strong>
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => setMobileTab("MENU")}
                    className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-orange-400 rounded-xl text-xs font-bold flex items-center gap-1 border border-stone-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Dishes
                  </button>
                </div>
              ) : (
                <div className="text-center py-2 text-stone-500 text-xs font-bold">
                  No table selected. Tap "Tables" tab to seat a table first.
                </div>
              )}
            </div>

            {/* Scrollable Cart & KOT History */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar pb-32">
              {orderSuccessMsg && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2 animate-bounce">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  {orderSuccessMsg}
                </div>
              )}

              {/* If not seated */}
              {!selectedTable?.activeSession && selectedTable && (
                <div className="p-4 bg-stone-900 rounded-2xl border border-stone-800 text-center space-y-3">
                  <p className="text-xs text-stone-300">Table {selectedTable.tableNumber} is not opened yet.</p>
                  <button
                    onClick={() => handleOpenTableModal(selectedTable)}
                    className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg cursor-pointer"
                  >
                    Open Dining Session
                  </button>
                </div>
              )}

              {/* Order Pad Items List */}
              {selectedTable?.activeSession && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-stone-400">
                      Dishes Ready to Send ({cartItems.length})
                    </span>
                    {cartItems.length > 0 && (
                      <button
                        onClick={() => setCartItems([])}
                        className="text-[11px] text-red-400 hover:text-red-300 font-bold"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {cartItems.length === 0 ? (
                    <div className="p-6 text-center bg-stone-900/60 rounded-2xl border border-stone-800/80 space-y-2">
                      <ShoppingBag className="w-8 h-8 text-stone-600 mx-auto" />
                      <p className="text-xs text-stone-400 font-bold">No new dishes added yet</p>
                      <button
                        onClick={() => setMobileTab("MENU")}
                        className="px-4 py-2 bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md"
                      >
                        + Browse Food Menu
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {cartItems.map((item) => (
                        <div
                          key={item.cartItemId}
                          className="bg-stone-900 p-3 rounded-2xl border border-stone-800 flex items-center justify-between gap-2 shadow-sm"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-white truncate">{item.productName}</p>
                            <p className="text-[10px] text-stone-400">
                              {item.variantName ? `${item.variantName} • ` : ""}
                              Rs. {item.calculatedPrice} each
                            </p>
                            {item.specialInstructions && (
                              <p className="text-[10px] text-orange-400/90 truncate italic">
                                Note: {item.specialInstructions}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                if (item.quantity > 1) {
                                  setCartItems((prev) =>
                                    prev.map((it) =>
                                      it.cartItemId === item.cartItemId
                                        ? { ...it, quantity: it.quantity - 1 }
                                        : it
                                    )
                                  );
                                } else {
                                  handleRemoveCartItem(item.cartItemId);
                                }
                              }}
                              className="w-7 h-7 rounded-lg bg-stone-800 hover:bg-stone-700 text-white flex items-center justify-center text-xs font-bold"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-black text-white w-5 text-center">{item.quantity}</span>
                            <button
                              onClick={() =>
                                setCartItems((prev) =>
                                  prev.map((it) =>
                                    it.cartItemId === item.cartItemId
                                      ? { ...it, quantity: it.quantity + 1 }
                                      : it
                                  )
                                )
                              }
                              className="w-7 h-7 rounded-lg bg-stone-800 hover:bg-stone-700 text-white flex items-center justify-center text-xs font-bold"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Previous Kitchen KOTs */}
                  {sessionDetails?.kotTickets && sessionDetails.kotTickets.length > 0 && (
                    <div className="pt-4 border-t border-stone-800 space-y-2.5">
                      <span className="text-xs font-black uppercase tracking-wider text-stone-400 block">
                        Placed KOT Tickets ({sessionDetails.kotTickets.length})
                      </span>
                      <div className="space-y-2.5">
                        {sessionDetails.kotTickets.map((kot: any) => {
                          const isReady = kot.status === "READY";
                          const isServed = kot.status === "SERVED";
                          const isCooking = kot.status === "PREPARING";

                          return (
                            <div
                              key={kot.id}
                              className={`p-3 rounded-2xl border text-xs transition-all ${
                                isReady
                                  ? "bg-emerald-950/60 border-emerald-500/70 shadow-md ring-1 ring-emerald-500/40"
                                  : isCooking
                                  ? "bg-amber-950/40 border-amber-500/50"
                                  : isServed
                                  ? "bg-stone-900/40 border-stone-800 opacity-80"
                                  : "bg-stone-950/70 border-stone-800/80"
                              }`}
                            >
                              <div className="flex justify-between items-center mb-1.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-black text-stone-200">KOT #{kot.ticketNumber}</span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                      isReady
                                        ? "bg-emerald-500 text-stone-950 animate-pulse"
                                        : isCooking
                                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                        : isServed
                                        ? "bg-stone-800 text-stone-400"
                                        : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                    }`}
                                  >
                                    {kot.status}
                                  </span>
                                </div>
                                <span className="text-stone-500 text-[10px]">
                                  {new Date(kot.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>

                              <div className="space-y-1 my-1.5">
                                {kot.items.map((it: any) => (
                                  <div key={it.id} className="flex justify-between text-stone-300 text-[11px]">
                                    <span>
                                      {it.quantity}x {it.itemName} {it.itemDetails ? `(${it.itemDetails})` : ""}
                                    </span>
                                    <span className="text-[10px] text-stone-500 uppercase">{it.status}</span>
                                  </div>
                                ))}
                              </div>

                              {isReady && (
                                <button
                                  onClick={() => handleMarkDelivered(kot.id)}
                                  disabled={deliveringTicketId === kot.id}
                                  className="mt-2 w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/25"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {deliveringTicketId === kot.id ? "Updating..." : "Mark Delivered to Table"}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Fixed Mobile Bottom Action Bar */}
            {selectedTable?.activeSession && cartItems.length > 0 && (
              <div className="fixed bottom-0 left-0 right-0 p-3 bg-stone-900 border-t border-stone-800 shadow-2xl z-40 space-y-2">
                <input
                  type="text"
                  placeholder="Kitchen note (e.g. Extra spicy, serve drinks first)..."
                  value={tableNotes}
                  onChange={(e) => setTableNotes(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-orange-500"
                />
                <button
                  disabled={submittingOrder}
                  onClick={handleSendToKitchen}
                  className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-between px-4 shadow-lg shadow-orange-600/30 active:scale-[0.98] cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    <span>{submittingOrder ? "Sending to Kitchen..." : "Send to Kitchen (KOT)"}</span>
                  </div>
                  <span className="text-sm font-black font-mono">Rs. {cartSubtotal.toFixed(0)}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. DESKTOP 3-COLUMN SPLIT VIEW (Visible on lg+ screens) */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        {/* Left Column: Floor / Tables Grid */}
        <div className="w-72 lg:w-80 bg-stone-900/70 border-r border-stone-800 flex flex-col shrink-0">
          <div className="p-3 border-b border-stone-800 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-stone-400">Floor Tables</span>
            <span className="text-xs font-bold text-stone-500">{tables.length} Total</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
            {loadingTables ? (
              <div className="text-center py-12 text-stone-500 text-xs">Loading tables...</div>
            ) : tables.length === 0 ? (
              <div className="text-center py-12 text-stone-500 text-xs">
                No tables found. Add tables in Admin Settings.
              </div>
            ) : (
              tables.map((table) => {
                const isSelected = selectedTable?.id === table.id;
                const isOccupied = table.status === "OCCUPIED" && table.activeSession;

                return (
                  <div
                    key={table.id}
                    onClick={() => handleSelectTable(table)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? "bg-orange-950/40 border-orange-500 ring-1 ring-orange-500/50 shadow-lg shadow-orange-950/50"
                        : isOccupied
                        ? "bg-stone-850 border-amber-800/60 hover:border-amber-700/80"
                        : "bg-stone-900/60 border-stone-800 hover:border-stone-700"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black tracking-tight text-white">{table.tableNumber}</span>
                        <span className="text-[11px] font-semibold text-stone-400 flex items-center gap-0.5">
                          <Users className="w-3 h-3 text-stone-500" />
                          {table.capacity}p
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isOccupied
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {isOccupied ? "Occupied" : "Free"}
                      </span>
                    </div>

                    {isOccupied ? (
                      <div className="mt-2 text-xs space-y-1">
                        <div className="flex items-center justify-between text-stone-300 font-medium">
                          <span className="flex items-center gap-1 text-[11px] text-stone-400">
                            <User className="w-3 h-3" />
                            {table.activeSession?.waiterName}
                          </span>
                          <span className="font-bold text-orange-400">
                            Rs. {table.activeSession?.totalAmount.toFixed(0)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-stone-500">
                          <span>
                            {table.activeSession?.ordersCount || 0} orders ({table.activeSession?.itemCount || 0} items)
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(table.activeSession?.openedAt || "").toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTableModal(table);
                          }}
                          className="px-2.5 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Open Table
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Center Column: Menu Catalog & Categories */}
        <div className="flex-1 flex flex-col bg-stone-950 overflow-hidden">
          {/* Menu Search & Category Tabs */}
          <div className="p-3 border-b border-stone-800 space-y-2.5 bg-stone-900/30">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search momo, chowmein, sekuwa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Category horizontal scroll */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? "bg-orange-600 text-white shadow-md shadow-orange-600/30"
                      : "bg-stone-900 text-stone-400 hover:bg-stone-800 hover:text-stone-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 auto-rows-max items-start content-start custom-scrollbar">
            {filteredProducts.map((prod) => {
              const isWeight = prod.priceType === "weight";
              const hasVariants = prod.variants && prod.variants.length > 0;
              const firstVariant = hasVariants ? prod.variants![0] : null;

              const priceDisplay = isWeight
                ? `Rs. ${prod.pricePerKg}/kg`
                : firstVariant
                ? `Rs. ${firstVariant.price}`
                : `Rs. ${prod.pricePerKg || 0}`;

              const portionHint =
                !isWeight && firstVariant
                  ? prod.variants!.length > 1
                    ? `/${firstVariant.name} (+${prod.variants!.length - 1})`
                    : `/${firstVariant.name}`
                  : "";

              return (
                <div
                  key={prod.id}
                  onClick={() => handleProductClick(prod)}
                  className="bg-stone-900 border border-stone-800/80 hover:border-orange-500/70 rounded-2xl p-3 flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl group h-fit select-none"
                >
                  <div>
                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-stone-800 relative mb-2.5">
                      <img
                        src={prod.image || "/images/logo.png"}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {isWeight ? (
                        <span className="absolute top-1.5 left-1.5 bg-orange-600 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded shadow">
                          Weight Based
                        </span>
                      ) : prod.variants && prod.variants.length > 1 ? (
                        <span className="absolute top-1.5 left-1.5 bg-stone-900/90 text-amber-400 border border-amber-500/40 text-[9px] font-black uppercase px-1.5 py-0.5 rounded shadow">
                          {prod.variants.length} Portions
                        </span>
                      ) : null}
                    </div>
                    <h3 className="font-black text-xs text-stone-100 line-clamp-1">{prod.name}</h3>
                    <p className="text-[11px] text-stone-400 mt-0.5 line-clamp-1">{prod.category}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-stone-800">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-orange-400">{priceDisplay}</span>
                      {portionHint && (
                        <span className="text-[10px] text-stone-400 truncate max-w-[90px]">{portionHint}</span>
                      )}
                    </div>
                    <span className="w-6 h-6 rounded-lg bg-stone-800 group-hover:bg-orange-600 group-hover:text-white flex items-center justify-center text-stone-400 text-xs font-black transition-colors">
                      +
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Order Pad & Table Session */}
        <div className="w-80 lg:w-96 bg-stone-900 border-l border-stone-800 flex flex-col shrink-0">
          {/* Active Session Header */}
          <div className="p-4 border-b border-stone-800 bg-stone-900/80">
            {selectedTable ? (
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-white">{selectedTable.tableNumber}</span>
                    {selectedTable.activeSession ? (
                      <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                        Occupied ({selectedTable.activeSession.guestCount} Guests)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                        Available Table ({selectedTable.capacity}p)
                      </span>
                    )}
                  </div>
                  {selectedTable.activeSession && (
                    <Link
                      to="/billing"
                      className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      Bill Table
                    </Link>
                  )}
                </div>
                {selectedTable.activeSession && (
                  <div className="text-xs text-stone-400 mt-1 flex items-center justify-between">
                    <span className="font-semibold text-stone-300">
                      🤵 Waiter: {selectedTable.activeSession.waiterName}
                    </span>
                    <span className="font-bold text-orange-400">
                      Running: Rs. {selectedTable.activeSession.totalAmount.toFixed(0)}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-2 text-stone-500 text-xs">
                Select a table on the left to begin taking orders
              </div>
            )}
          </div>

          {/* New Items Order Pad Cart */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {orderSuccessMsg && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2 animate-bounce">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                {orderSuccessMsg}
              </div>
            )}

            {!selectedTable?.activeSession && selectedTable && (
              <div className="p-4 bg-stone-850 rounded-2xl border border-stone-800 text-center space-y-3">
                <p className="text-xs text-stone-300">Table {selectedTable.tableNumber} is currently not seated.</p>
                <button
                  onClick={() => handleOpenTableModal(selectedTable)}
                  className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg cursor-pointer"
                >
                  Open Dining Session
                </button>
              </div>
            )}

            {/* Cart Items List */}
            {selectedTable?.activeSession && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-stone-400">
                    New Order Items ({cartItems.length})
                  </span>
                  {cartItems.length > 0 && (
                    <button
                      onClick={() => setCartItems([])}
                      className="text-[10px] text-red-400 hover:text-red-300 font-bold"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {cartItems.length === 0 ? (
                  <div className="text-center py-8 text-stone-600 text-xs">
                    Tap dishes on the center menu to add items to this table.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cartItems.map((item) => (
                      <div
                        key={item.cartItemId}
                        className="bg-stone-850 p-2.5 rounded-xl border border-stone-800 flex items-center justify-between gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{item.productName}</p>
                          <p className="text-[10px] text-stone-400">
                            {item.variantName ? `${item.variantName} • ` : ""}
                            Rs. {item.calculatedPrice} each
                          </p>
                          {item.specialInstructions && (
                            <p className="text-[10px] text-orange-400/90 truncate italic">
                              Note: {item.specialInstructions}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              if (item.quantity > 1) {
                                setCartItems((prev) =>
                                  prev.map((it) =>
                                    it.cartItemId === item.cartItemId
                                      ? { ...it, quantity: it.quantity - 1 }
                                      : it
                                  )
                                );
                              } else {
                                handleRemoveCartItem(item.cartItemId);
                              }
                            }}
                            className="w-6 h-6 rounded-md bg-stone-700 hover:bg-stone-600 text-white flex items-center justify-center text-xs"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-black text-white w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() =>
                              setCartItems((prev) =>
                                prev.map((it) =>
                                  it.cartItemId === item.cartItemId
                                    ? { ...it, quantity: it.quantity + 1 }
                                    : it
                                )
                              )
                            }
                            className="w-6 h-6 rounded-md bg-stone-700 hover:bg-stone-600 text-white flex items-center justify-center text-xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Previous KOT Tickets / Running Orders in this Session */}
                {sessionDetails?.kotTickets && sessionDetails.kotTickets.length > 0 && (
                  <div className="pt-4 border-t border-stone-800 space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-black uppercase tracking-wider text-stone-400">
                        Kitchen KOT Status ({sessionDetails.kotTickets.length})
                      </span>
                      <span className="text-[10px] text-stone-500 font-semibold">Auto-Syncs</span>
                    </div>
                    <div className="space-y-2.5 max-h-56 overflow-y-auto custom-scrollbar">
                      {sessionDetails.kotTickets.map((kot: any) => {
                        const isReady = kot.status === "READY";
                        const isServed = kot.status === "SERVED";
                        const isCooking = kot.status === "PREPARING";

                        return (
                          <div
                            key={kot.id}
                            className={`p-3 rounded-xl border text-xs transition-all ${
                              isReady
                                ? "bg-emerald-950/60 border-emerald-500/70 shadow-md ring-1 ring-emerald-500/40"
                                : isCooking
                                ? "bg-amber-950/40 border-amber-500/50"
                                : isServed
                                ? "bg-stone-900/40 border-stone-800 opacity-80"
                                : "bg-stone-950/70 border-stone-800/80"
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-stone-200">KOT #{kot.ticketNumber}</span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                    isReady
                                      ? "bg-emerald-500 text-stone-950 animate-pulse"
                                      : isCooking
                                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                      : isServed
                                      ? "bg-stone-800 text-stone-400"
                                      : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                  }`}
                                >
                                  {kot.status}
                                </span>
                              </div>
                              <span className="text-stone-500 text-[10px]">
                                {new Date(kot.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>

                            <div className="space-y-1 my-1.5">
                              {kot.items.map((it: any) => (
                                <div key={it.id} className="flex justify-between text-stone-300 text-[11px]">
                                  <span>
                                    {it.quantity}x {it.itemName} {it.itemDetails ? `(${it.itemDetails})` : ""}
                                  </span>
                                  <span className="text-[10px] text-stone-500 uppercase">{it.status}</span>
                                </div>
                              ))}
                            </div>

                            {/* Waiter Mark Delivered Action Button */}
                            {isReady && (
                              <button
                                onClick={() => handleMarkDelivered(kot.id)}
                                disabled={deliveringTicketId === kot.id}
                                className="mt-2 w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/25 cursor-pointer active:scale-[0.98]"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {deliveringTicketId === kot.id ? "Updating..." : "Mark Delivered to Table"}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Bottom Send to Kitchen Action Bar */}
          {selectedTable?.activeSession && (
            <div className="p-4 border-t border-stone-800 bg-stone-900/90 space-y-3">
              <input
                type="text"
                placeholder="Kitchen note (e.g. Serve fast / VIP guest)..."
                value={tableNotes}
                onChange={(e) => setTableNotes(e.target.value)}
                className="w-full bg-stone-850 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-orange-500"
              />

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-400">KOT Amount:</span>
                <span className="text-lg font-black text-orange-400">Rs. {cartSubtotal.toFixed(0)}</span>
              </div>

              <button
                disabled={cartItems.length === 0 || submittingOrder}
                onClick={handleSendToKitchen}
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 disabled:bg-stone-800 disabled:text-stone-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-600/30 active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {submittingOrder ? "Sending..." : "Send to Kitchen (KOT)"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Open Table Session */}
      {openModalTable && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-white">Open Table {openModalTable.tableNumber}</h3>
                <p className="text-xs text-stone-400">
                  Capacity: <strong className="text-orange-400">{openModalTable.capacity} Guests</strong>
                </p>
              </div>
              <button
                onClick={() => setOpenModalTable(null)}
                className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Dynamic Number of Guests with Unlimited / Extra Chairs Support */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-orange-500" />
                    Number of Guests
                  </label>
                  <span className="text-[11px] font-semibold text-stone-400">
                    Base Capacity: <strong className="text-orange-400">{openModalTable.capacity} Seats</strong>
                  </span>
                </div>

                {/* Quick Selection Preset Buttons (1..capacity + extra chairs) */}
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                  {Array.from(
                    new Set([
                      ...Array.from({ length: Math.max(openModalTable.capacity, 4) }, (_, i) => i + 1),
                      openModalTable.capacity + 1,
                      openModalTable.capacity + 2,
                    ])
                  )
                    .sort((a, b) => a - b)
                    .map((num) => {
                      const isExtra = num > openModalTable.capacity;
                      const isSelected = guestCount === num;
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setGuestCount(num)}
                          className={`py-2 px-1 rounded-xl text-xs font-black transition-all cursor-pointer text-center flex flex-col items-center justify-center ${
                            isSelected
                              ? isExtra
                                ? "bg-amber-500 text-black shadow-md shadow-amber-500/30"
                                : "bg-orange-600 text-white shadow-md shadow-orange-600/30"
                              : isExtra
                              ? "bg-stone-800/80 text-amber-300 hover:bg-stone-700/90 border border-amber-500/30"
                              : "bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white border border-stone-700/60"
                          }`}
                        >
                          <span>{num} {num === 1 ? "Guest" : "Guests"}</span>
                          {isExtra && (
                            <span className="text-[9px] opacity-80 font-bold leading-none mt-0.5">
                              +{num - openModalTable.capacity} extra
                            </span>
                          )}
                        </button>
                      );
                    })}
                </div>

                {/* Custom Stepper and Direct Input for any extra seats */}
                <div className="mt-2.5 p-2.5 bg-stone-800/90 rounded-2xl border border-stone-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-stone-300 font-bold block">Selected Seating:</span>
                      {guestCount > openModalTable.capacity ? (
                        <span className="text-[10px] font-extrabold text-amber-400 flex items-center gap-1">
                          ⚡ +{guestCount - openModalTable.capacity} Extra Chair{guestCount - openModalTable.capacity > 1 ? "s" : ""} Added
                        </span>
                      ) : (
                        <span className="text-[10px] text-stone-400">Standard table capacity</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setGuestCount((prev) => Math.max(1, prev - 1))}
                        className="w-8 h-8 bg-stone-700 hover:bg-stone-600 rounded-xl flex items-center justify-center text-white font-bold cursor-pointer active:scale-95 transition-all"
                        title="Minus 1 Guest"
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={guestCount}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val >= 1) {
                            setGuestCount(val);
                          } else if (e.target.value === "") {
                            setGuestCount(1);
                          }
                        }}
                        className="w-12 h-8 bg-stone-900 border border-stone-600 rounded-xl text-center text-sm font-black text-white focus:outline-none focus:border-orange-500"
                      />

                      <button
                        type="button"
                        onClick={() => setGuestCount((prev) => prev + 1)}
                        className="w-8 h-8 bg-stone-700 hover:bg-stone-600 rounded-xl flex items-center justify-center text-white font-bold cursor-pointer active:scale-95 transition-all"
                        title="Plus 1 Guest"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Quick Extra Chair Adder Buttons */}
                  <div className="flex items-center gap-1.5 pt-1 border-t border-stone-700/60">
                    <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider shrink-0">
                      Extra Chairs:
                    </span>
                    <button
                      type="button"
                      onClick={() => setGuestCount((prev) => prev + 1)}
                      className="px-2 py-1 bg-stone-700 hover:bg-stone-600 text-stone-200 text-[11px] font-bold rounded-lg transition-all active:scale-95 cursor-pointer"
                    >
                      +1 Chair
                    </button>
                    <button
                      type="button"
                      onClick={() => setGuestCount((prev) => prev + 2)}
                      className="px-2 py-1 bg-stone-700 hover:bg-stone-600 text-stone-200 text-[11px] font-bold rounded-lg transition-all active:scale-95 cursor-pointer"
                    >
                      +2 Chairs
                    </button>
                    <button
                      type="button"
                      onClick={() => setGuestCount((prev) => prev + 4)}
                      className="px-2 py-1 bg-stone-700 hover:bg-stone-600 text-stone-200 text-[11px] font-bold rounded-lg transition-all active:scale-95 cursor-pointer"
                    >
                      +4 Chairs
                    </button>
                  </div>
                </div>
              </div>

              {/* Mandatory Assigned Waiter Selection */}
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5">
                  Assigned Waiter / Staff <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedWaiterId}
                  onChange={(e) => {
                    setSelectedWaiterId(e.target.value);
                    setOpenTableError("");
                  }}
                  required
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 cursor-pointer font-semibold"
                >
                  <option value="">-- Select Assigned Waiter (Required) --</option>
                  {waiterList.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.employeeCode || "Waiter"})
                    </option>
                  ))}
                </select>
                {openTableError && (
                  <p className="text-xs text-red-400 font-bold mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {openTableError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5">Table Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Anniversary table, window preference"
                  value={openSessionNotes}
                  onChange={(e) => setOpenSessionNotes(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOpenModalTable(null)}
                className="flex-1 py-3 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={openingSession}
                onClick={handleOpenTableSession}
                className="flex-1 py-3 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-orange-600/30 cursor-pointer disabled:opacity-60"
              >
                {openingSession ? "Opening..." : "Seat Table"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Product Weight / Portion Customizer */}
      {activeProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-stone-800 overflow-hidden shrink-0">
                  <img src={activeProduct.image || "/images/logo.png"} alt={activeProduct.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">{activeProduct.name}</h3>
                  <p className="text-xs text-stone-400">{activeProduct.category}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveProduct(null)}
                className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Price Type Specific Options */}
            {activeProduct.priceType === "weight" ? (
              <div className="space-y-4">
                <div className="p-3 bg-stone-850 rounded-2xl border border-stone-800 flex justify-between items-center">
                  <span className="text-xs font-bold text-stone-400">Price Rate:</span>
                  <span className="text-sm font-black text-orange-400">Rs. {activeProduct.pricePerKg} / kg</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1.5">Select Weight Portion</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(activeProduct.weightOptions || [{ value: 250, unit: "g" }, { value: 500, unit: "g" }, { value: 1000, unit: "g" }]).map((opt) => {
                      const isSelected = selectedWeightGrams === opt.value && !customWeightInput;
                      const price = Math.round(((activeProduct.pricePerKg || 0) * opt.value) / 1000);
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setSelectedWeightGrams(opt.value);
                            setCustomWeightInput("");
                          }}
                          className={`p-2.5 rounded-xl border text-center transition-all ${
                            isSelected
                              ? "bg-orange-600 border-orange-500 text-white shadow-md shadow-orange-600/30"
                              : "bg-stone-850 border-stone-700 text-stone-300 hover:border-stone-600"
                          }`}
                        >
                          <div className="text-xs font-black">{opt.value}g</div>
                          <div className="text-[10px] opacity-80 mt-0.5">Rs. {price}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {activeProduct.allowCustomWeight && (
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1.5">Or Custom Weight (Grams)</label>
                    <input
                      type="number"
                      placeholder="e.g. 750"
                      value={customWeightInput}
                      onChange={(e) => setCustomWeightInput(e.target.value)}
                      className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-2">Select Serving Portion</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {(activeProduct.variants && activeProduct.variants.length > 0 
                    ? activeProduct.variants 
                    : [{ name: "Full Plate / Standard", price: activeProduct.pricePerKg || 0 }]
                  ).map((v) => {
                    const isSelected = selectedVariant?.name === v.name;
                    return (
                      <button
                        key={v.name}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`p-3.5 rounded-2xl border-2 text-left transition-all relative ${
                          isSelected
                            ? "bg-orange-600 border-orange-400 text-white shadow-lg shadow-orange-600/30 scale-[1.02]"
                            : "bg-stone-850 border-stone-700/80 text-stone-300 hover:border-stone-500 hover:bg-stone-800"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-black line-clamp-1">{v.name}</div>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div className={`text-sm font-black mt-1 ${isSelected ? "text-white" : "text-orange-400"}`}>
                          Rs. {v.price}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Special Instructions & Quantity */}
            <div className="space-y-3 pt-2 border-t border-stone-800">
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5">Special Cooking Note</label>
                <input
                  type="text"
                  placeholder="e.g. Extra spicy, no onion, well done..."
                  value={itemInstructions}
                  onChange={(e) => setItemInstructions(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-300">Quantity</span>
                <div className="flex items-center gap-3 bg-stone-800 px-3 py-1.5 rounded-xl border border-stone-700">
                  <button
                    type="button"
                    onClick={() => setItemQty(Math.max(1, itemQty - 1))}
                    className="text-stone-400 hover:text-white"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-black text-white w-6 text-center">{itemQty}</span>
                  <button
                    type="button"
                    onClick={() => setItemQty(itemQty + 1)}
                    className="text-stone-400 hover:text-white"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveProduct(null)}
                className="flex-1 py-3 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 py-3 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-orange-600/30"
              >
                Add to KOT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
