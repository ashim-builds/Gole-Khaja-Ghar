import React, { useState, useEffect } from "react";
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  Edit2,
  QrCode,
  Users,
  CheckCircle2,
  X,
  Printer,
  RotateCcw,
  History,
  Clock,
  User,
  Calendar,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";

interface TableItem {
  id: string;
  tableNumber: string;
  capacity: number;
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED" | "OUT_OF_SERVICE";
  qrCodeToken?: string;
  activeSession: any;
}

interface TableHistoryItem {
  id: string;
  tableId: string;
  tableNumber: string;
  status: "ACTIVE" | "CLOSED";
  guestCount: number;
  waiterName: string;
  waiterCode: string;
  openedAt: string;
  closedAt: string | null;
  durationMinutes: number;
  notes: string | null;
  totalAmount: number;
  totalItems: number;
  billStatus: string;
  paymentMethod: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  ordersCount: number;
}

export default function AdminTablesPage() {
  const [activeTab, setActiveTab] = useState<"FLOOR" | "HISTORY">("FLOOR");
  const [tables, setTables] = useState<TableItem[]>([]);
  const [historyLogs, setHistoryLogs] = useState<TableHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TableItem | null>(null);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  // Form State
  const [tableNumber, setTableNumber] = useState("");
  const [capacity, setCapacity] = useState(4);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // History Filter
  const [historyTableFilter, setHistoryTableFilter] = useState<string>("ALL");

  // QR Modal
  const [qrModalTable, setQrModalTable] = useState<TableItem | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const res = await api.tables.list();
      if (res.success) {
        setTables(res.tables);
      }
    } catch (err) {
      console.error("Failed to fetch tables", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await fetch("/api/tables/history?limit=100");
      const data = await res.json();
      if (data.success && data.history) {
        setHistoryLogs(data.history);
      }
    } catch (err) {
      console.error("Failed to fetch table history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (activeTab === "HISTORY") {
      fetchHistory();
    }
  }, [activeTab]);

  const handleOpenAddModal = () => {
    setEditingTable(null);
    setTableNumber(`T-${tables.length + 1}`);
    setCapacity(4);
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleOpenEditModal = (table: TableItem) => {
    setEditingTable(table);
    setTableNumber(table.tableNumber);
    setCapacity(table.capacity);
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!tableNumber.trim()) {
      setErrorMsg("Table number is required (e.g. T-1, T-2)");
      return;
    }

    try {
      setSaving(true);
      if (editingTable) {
        const res = await api.tables.update(editingTable.id, {
          tableNumber: tableNumber.trim(),
          capacity,
        });
        if (res.success) {
          setModalOpen(false);
          fetchTables();
        }
      } else {
        const res = await api.tables.create({
          tableNumber: tableNumber.trim(),
          capacity,
        });
        if (res.success) {
          setModalOpen(false);
          fetchTables();
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save table");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTable = async (table: TableItem) => {
    if (!confirm(`Are you sure you want to delete Table ${table.tableNumber}?`)) return;

    try {
      const res = await api.tables.delete(table.id);
      if (res.success) {
        fetchTables();
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete table");
    }
  };

  const filteredHistory = historyLogs.filter((item) => {
    if (historyTableFilter !== "ALL" && item.tableNumber !== historyTableFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Segmented Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
            <UtensilsCrossed className="w-7 h-7 text-orange-600" />
            Dining Tables & Occupancy History
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm mt-0.5">
            Manage live dining tables, QR standees, and audit history of occupied/vacated sessions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-stone-200/80 rounded-xl">
            <button
              onClick={() => setActiveTab("FLOOR")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "FLOOR" ? "bg-white text-stone-900 shadow-sm" : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Floor Layout ({tables.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("HISTORY")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "HISTORY" ? "bg-white text-orange-600 shadow-sm" : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Session History</span>
            </button>
          </div>

          <button
            onClick={activeTab === "FLOOR" ? fetchTables : fetchHistory}
            className="p-2.5 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl text-stone-600 transition-colors shadow-sm cursor-pointer"
            title="Refresh"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {activeTab === "FLOOR" && (
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-lg shadow-orange-600/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Table
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: FLOOR LAYOUT */}
      {activeTab === "FLOOR" && (
        <>
          {loading ? (
            <div className="text-center py-20 text-stone-400 font-bold">Loading tables...</div>
          ) : tables.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-3xl border border-stone-200 p-8 space-y-4">
              <UtensilsCrossed className="w-12 h-12 text-stone-300 mx-auto" />
              <h3 className="text-lg font-black text-stone-700">No Dining Tables Configured</h3>
              <p className="text-stone-500 text-xs max-w-sm mx-auto">
                Add tables like T-1, T-2, VIP-1 so waiters can assign dine-in guests and manage POS orders.
              </p>
              <button
                onClick={handleOpenAddModal}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-orange-600/25 cursor-pointer"
              >
                Add Table T-1
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {tables.map((tbl) => {
                const isOccupied = tbl.status === "OCCUPIED" && tbl.activeSession;
                return (
                  <div
                    key={tbl.id}
                    className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-2xl font-black text-stone-900">{tbl.tableNumber}</span>
                          <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-1">
                            <Users className="w-3.5 h-3.5 text-stone-400" />
                            <span>Capacity: {tbl.capacity} Guests</span>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                            isOccupied
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          }`}
                        >
                          {isOccupied ? "Occupied" : "Available"}
                        </span>
                      </div>

                      {isOccupied && (
                        <div className="mt-4 p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1">
                          <div className="flex justify-between text-stone-600">
                            <span>Staff:</span>
                            <span className="font-bold text-stone-900">{tbl.activeSession.waiterName}</span>
                          </div>
                          <div className="flex justify-between text-stone-600">
                            <span>Running Bill:</span>
                            <span className="font-bold text-orange-600">
                              Rs. {tbl.activeSession.totalAmount.toFixed(0)}
                            </span>
                          </div>
                          <div className="flex justify-between text-[11px] text-stone-400 pt-1 border-t border-stone-200">
                            <span>Seated at:</span>
                            <span>
                              {new Date(tbl.activeSession.openedAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between">
                      <button
                        onClick={() => setQrModalTable(tbl)}
                        className="p-2 hover:bg-stone-100 rounded-lg text-stone-600 hover:text-stone-900 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
                        title="View QR Code"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>QR</span>
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(tbl)}
                          className="p-2 hover:bg-stone-100 rounded-lg text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
                          title="Edit Table"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTable(tbl)}
                          className="p-2 hover:bg-red-50 rounded-lg text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete Table"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* VIEW 2: TABLE HISTORY AUDIT LOG */}
      {activeTab === "HISTORY" && (
        <div className="space-y-4">
          {/* Table filter bar (Non-scrolling, 100% responsive) */}
          <div className="bg-white p-3 rounded-2xl border border-stone-200/90 shadow-xs flex items-center justify-between gap-3">
            <span className="text-xs font-black uppercase tracking-wider text-stone-500 shrink-0">Filter Table:</span>
            <div className="relative flex-1 max-w-xs">
              <select
                value={historyTableFilter}
                onChange={(e) => setHistoryTableFilter(e.target.value)}
                className="w-full appearance-none bg-stone-50 hover:bg-stone-100/80 border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 pr-8 focus:outline-none focus:border-orange-500 focus:bg-white transition-all cursor-pointer truncate"
              >
                <option value="ALL">All Tables ({historyLogs.length} sessions)</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.tableNumber}>
                    Table {t.tableNumber}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* History List */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
            {loadingHistory ? (
              <div className="text-center py-20 text-stone-400 font-bold">Loading session history...</div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-16 text-stone-400 space-y-2">
                <History className="w-10 h-10 text-stone-300 mx-auto" />
                <p className="font-bold text-stone-600">No session history records found</p>
                <p className="text-xs text-stone-400">Past occupied and vacated table sessions will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-4">Table</th>
                      <th className="p-4">Session Status</th>
                      <th className="p-4">Staff & Guests</th>
                      <th className="p-4">Occupied Time</th>
                      <th className="p-4">Vacated / Closed</th>
                      <th className="p-4">Duration</th>
                      <th className="p-4">Total Paid</th>
                      <th className="p-4 text-right">Order Breakdown</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredHistory.map((sess) => {
                      const isExpanded = expandedSessionId === sess.id;
                      const isOpen = sess.status === "ACTIVE";

                      return (
                        <React.Fragment key={sess.id}>
                          <tr className="hover:bg-stone-50 transition-colors">
                            <td className="p-4">
                              <span className="font-black text-stone-900 text-sm">{sess.tableNumber}</span>
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  isOpen
                                    ? "bg-amber-100 text-amber-800 border border-amber-300 animate-pulse"
                                    : "bg-stone-100 text-stone-600"
                                }`}
                              >
                                {isOpen ? "Currently Occupied" : "Vacated / Empty"}
                              </span>
                            </td>
                            <td className="p-4">
                              <p className="font-bold text-stone-800">{sess.waiterName} ({sess.waiterCode})</p>
                              <p className="text-[11px] text-stone-400">{sess.guestCount} Guests</p>
                            </td>
                            <td className="p-4 text-stone-600 font-medium">
                              <div>{new Date(sess.openedAt).toLocaleDateString()}</div>
                              <div className="text-[10px] text-stone-400">
                                {new Date(sess.openedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </div>
                            </td>
                            <td className="p-4 text-stone-600 font-medium">
                              {sess.closedAt ? (
                                <>
                                  <div>{new Date(sess.closedAt).toLocaleDateString()}</div>
                                  <div className="text-[10px] text-stone-400">
                                    {new Date(sess.closedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </div>
                                </>
                              ) : (
                                <span className="text-amber-600 font-bold">In Progress</span>
                              )}
                            </td>
                            <td className="p-4 font-bold text-stone-700">
                              {sess.durationMinutes} mins
                            </td>
                            <td className="p-4">
                              <span className="font-black text-stone-900 text-sm">
                                Rs. {sess.totalAmount.toFixed(0)}
                              </span>
                              <p className="text-[10px] text-stone-400 uppercase font-semibold">
                                {sess.paymentMethod}
                              </p>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => setExpandedSessionId(isExpanded ? null : sess.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
                              >
                                <span>{sess.items.length} items</span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Items Drawer */}
                          {isExpanded && (
                            <tr className="bg-stone-50/80">
                              <td colSpan={8} className="p-4">
                                <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-2">
                                  <div className="flex justify-between items-center border-b border-stone-100 pb-2">
                                    <span className="text-xs font-black uppercase tracking-wider text-stone-500">
                                      Dishes Ordered ({sess.items.length} items across {sess.ordersCount} KOTs)
                                    </span>
                                    {sess.notes && (
                                      <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded">
                                        Notes: {sess.notes}
                                      </span>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                                    {sess.items.map((it, idx) => (
                                      <div key={idx} className="flex justify-between items-center p-2 bg-stone-50 rounded-lg text-xs">
                                        <span className="font-bold text-stone-800">{it.quantity}x {it.name}</span>
                                        <span className="font-black text-stone-600">Rs. {it.price * it.quantity}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Table Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-stone-900">
                {editingTable ? `Edit Table ${editingTable.tableNumber}` : "Add New Table"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-bold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveTable} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Table Label / Number (e.g. T-1, T-2, VIP-1)
                </label>
                <input
                  type="text"
                  required
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full border border-stone-300 bg-stone-50 text-stone-900 focus:bg-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-500 uppercase font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">Seating Capacity</label>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 4, 6, 8].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCapacity(num)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        capacity === num
                          ? "bg-stone-900 text-white"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      {num} Seats
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-orange-600/25 cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Table"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Printable Modal */}
      {qrModalTable && (() => {
        const tableUrl = `${window.location.origin}/shop?table=${encodeURIComponent(qrModalTable.tableNumber)}`;
        const handleCopy = () => {
          navigator.clipboard.writeText(tableUrl);
          setCopiedLink(true);
          setTimeout(() => setCopiedLink(false), 2000);
        };

        return (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-stone-200 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 text-center">
              <div className="flex justify-between items-center pb-2 border-b border-stone-100">
                <span className="text-xs font-black uppercase tracking-wider text-stone-500">
                  Dine-In Table Standee
                </span>
                <button
                  onClick={() => {
                    setQrModalTable(null);
                    setCopiedLink(false);
                  }}
                  className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Printable Table Standee Area */}
              <div
                id="table-standee-card"
                className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3 shadow-inner"
              >
                <div className="space-y-0.5">
                  <div className="w-9 h-9 mx-auto rounded-full bg-stone-900 border border-orange-500/30 overflow-hidden flex items-center justify-center mb-1">
                    <img
                      src="/images/logo.png"
                      alt="Logo"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/favicon-circle.png";
                      }}
                    />
                  </div>
                  <h3 className="text-sm font-black text-stone-900 uppercase tracking-tight">
                    GOLE KHAJA GHAR
                  </h3>
                  <p className="text-[10px] text-stone-500 font-semibold">
                    Dine-In Digital Self-Ordering
                  </p>
                </div>

                {/* REAL LIVE SCANNABLE QR CODE */}
                <div className="w-48 h-48 mx-auto bg-white p-2.5 rounded-2xl border border-stone-200 flex items-center justify-center shadow-md relative">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                      tableUrl
                    )}`}
                    alt={`Table ${qrModalTable.tableNumber} QR Code`}
                    className="w-full h-full object-contain rounded-xl"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-9 h-9 rounded-full bg-white p-0.5 border border-stone-300 shadow-md flex items-center justify-center">
                      <img
                        src="/images/logo.png"
                        alt="Logo"
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          e.currentTarget.src = "/favicon-circle.png";
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="inline-block px-3 py-1 bg-orange-600 text-white font-black text-sm rounded-xl shadow-md shadow-orange-600/25">
                    TABLE {qrModalTable.tableNumber}
                  </div>
                  <p className="text-[11px] font-bold text-stone-700 pt-1">
                    Scan with camera to view live menu & order
                  </p>
                  <p className="text-[9px] text-stone-400 font-mono break-all px-2">
                    {tableUrl}
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? "Link Copied!" : "Copy URL"}</span>
                </button>

                <a
                  href={tableUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl transition-all cursor-pointer shadow-sm"
                  title="Open Table Menu"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>

                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Standee</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
