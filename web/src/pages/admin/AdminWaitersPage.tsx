import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Trash2,
  Phone,
  Mail,
  BadgePercent,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  KeyRound,
  Shield,
} from "lucide-react";
import { api } from "@/lib/api";

interface Waiter {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  employeeCode: string;
  isActive: boolean;
  notes: string;
  createdAt: string;
}

export default function AdminWaitersPage() {
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState("");

  const fetchWaiters = async () => {
    setLoading(true);
    try {
      const res = await api.admin.waiters.list();
      if (res.success) {
        setWaiters(res.waiters || []);
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to load waiters" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaiters();
  }, []);

  const handleCreateWaiter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !employeeCode || !phone || !password) {
      setFeedback({ type: "error", text: "Please fill in all required fields." });
      return;
    }

    setCreating(true);
    setFeedback(null);
    try {
      const res = await api.admin.waiters.create({
        name,
        employeeCode,
        phone,
        email: email || undefined,
        password,
        notes: notes || undefined,
      });

      if (res.success) {
        setFeedback({
          type: "success",
          text: `Waiter "${name}" (Code: ${employeeCode.toUpperCase()}) created successfully!`,
        });
        setModalOpen(false);
        // Reset form
        setName("");
        setEmployeeCode("");
        setPhone("");
        setEmail("");
        setPassword("");
        setNotes("");
        fetchWaiters();
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to create waiter account." });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteWaiter = async (id: string, waiterName: string) => {
    if (!window.confirm(`Are you sure you want to delete waiter account "${waiterName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    setFeedback(null);
    try {
      const res = await api.admin.waiters.delete(id);
      if (res.success) {
        setFeedback({ type: "success", text: `Waiter "${waiterName}" deleted.` });
        setWaiters((prev) => prev.filter((w) => w.id !== id));
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to delete waiter." });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredWaiters = waiters.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.employeeCode.toLowerCase().includes(search.toLowerCase()) ||
      (w.phone && w.phone.includes(search))
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-black flex items-center gap-2">
            <Users className="w-8 h-8 text-primary" />
            Waiter Staff Management
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Create, manage, and delete waiter accounts. Waiters can login to take orders and manage tables.
          </p>
        </div>

        <button
          onClick={() => {
            setFeedback(null);
            setModalOpen(true);
          }}
          className="px-5 py-3 bg-primary text-black font-black text-xs uppercase tracking-wider rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          Add New Waiter
        </button>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border text-sm font-semibold transition-all ${
            feedback.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Search & Stats Filter */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search by name, code, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
          />
        </div>

        <div className="text-xs font-bold text-stone-500 self-end sm:self-center">
          Total Waiters: <span className="text-black font-black text-sm">{waiters.length}</span>
        </div>
      </div>

      {/* Waiters List */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredWaiters.length === 0 ? (
          <div className="text-center py-16 text-stone-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-stone-300" />
            <p className="text-base font-bold text-stone-700">No waiter accounts found</p>
            <p className="text-xs text-stone-400 mt-1">
              {search ? "Try refining your search" : "Click 'Add New Waiter' to create an account for staff."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 uppercase text-stone-500 font-extrabold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Employee Code</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Phone / Contact</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {filteredWaiters.map((w) => (
                  <tr key={w.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono font-black text-sm bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-lg">
                        {w.employeeCode}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-black text-sm">{w.name}</div>
                      {w.notes && <div className="text-[11px] text-stone-400 mt-0.5">{w.notes}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-stone-700">
                        <Phone className="w-3.5 h-3.5 text-stone-400" />
                        {w.phone || "—"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-stone-700">
                        <Mail className="w-3.5 h-3.5 text-stone-400" />
                        {w.email || "—"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          w.isActive
                            ? "bg-green-100 text-green-800 border border-green-200"
                            : "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {w.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        disabled={deletingId === w.id}
                        onClick={() => handleDeleteWaiter(w.id, w.name)}
                        className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Waiter"
                      >
                        {deletingId === w.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Waiter Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in duration-150">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 text-stone-400 hover:text-black cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-black">Add Waiter Account</h2>
                <p className="text-xs text-stone-500">
                  Waiter will use their Employee Code / Phone and Password to login.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateWaiter} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Thapa"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Employee Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. W-101"
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="98XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Email Address <span className="text-stone-400 lowercase font-normal">(optional)</span>
                </label>
                <input
                  type="email"
                  placeholder="ramesh@golekhajaghar.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Notes / Shift <span className="text-stone-400 lowercase font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Evening Shift / Hall 1"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs uppercase rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-3 bg-primary text-black font-black text-xs uppercase tracking-wider rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/20"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Waiter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
