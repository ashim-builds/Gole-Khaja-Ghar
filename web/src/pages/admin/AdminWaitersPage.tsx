import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Trash2,
  Phone,
  Mail,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  KeyRound,
  ChefHat,
  UtensilsCrossed,
} from "lucide-react";
import { api } from "@/lib/api";

interface StaffMember {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role?: string;
  employeeCode: string;
  isActive: boolean;
  notes: string;
  createdAt: string;
}

export default function AdminWaitersPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "WAITER" | "KITCHEN">("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State
  const [role, setRole] = useState<"WAITER" | "KITCHEN">("WAITER");
  const [name, setName] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState("");

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await api.admin.waiters.list();
      if (res.success) {
        setStaff((res.waiters || res.staff || []) as any);
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to load staff members" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedCode = employeeCode.trim().toUpperCase();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedCode || !trimmedPhone || !password) {
      setFeedback({ type: "error", text: "Please fill in all required fields." });
      return;
    }

    // 1. Strict Name validation (letters & spaces only, no digits)
    if (!/^[a-zA-Z\s.'-]+$/.test(trimmedName) || trimmedName.length < 2) {
      setFeedback({
        type: "error",
        text: "Full Name must only contain letters (no numbers or symbols allowed).",
      });
      return;
    }

    // 2. Strict Phone validation (exact 10 digits starting with 9)
    if (!/^9\d{9}$/.test(trimmedPhone)) {
      setFeedback({
        type: "error",
        text: "Phone Number must be exactly 10 digits starting with 9 (e.g. 98XXXXXXXX).",
      });
      return;
    }

    // 3. Strict Email validation (if provided)
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setFeedback({
        type: "error",
        text: "Please enter a valid original email address (e.g. name@gmail.com).",
      });
      return;
    }

    // 4. Strict Employee Code validation
    if (!/^[A-Z0-9_-]{2,20}$/.test(trimmedCode)) {
      setFeedback({
        type: "error",
        text: "Employee Code must be valid alphanumeric (e.g. W-101, CHEF-1).",
      });
      return;
    }

    setCreating(true);
    try {
      const res = await api.admin.waiters.create({
        name: trimmedName,
        employeeCode: trimmedCode,
        phone: trimmedPhone,
        email: trimmedEmail || undefined,
        password,
        role,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        setFeedback({
          type: "success",
          text: `${role === "KITCHEN" ? "Chef" : "Waiter"} "${trimmedName}" (Code: ${trimmedCode}) created successfully!`,
        });
        setModalOpen(false);
        // Reset form
        setName("");
        setEmployeeCode("");
        setPhone("");
        setEmail("");
        setPassword("");
        setNotes("");
        setRole("WAITER");
        fetchStaff();
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to create staff account." });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteStaff = async (id: string, staffName: string) => {
    if (!window.confirm(`Are you sure you want to delete staff account "${staffName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    setFeedback(null);
    try {
      const res = await api.admin.waiters.delete(id);
      if (res.success) {
        setFeedback({ type: "success", text: `Staff account "${staffName}" deleted.` });
        setStaff((prev) => prev.filter((w) => w.id !== id));
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to delete staff member." });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredStaff = staff.filter((w) => {
    const matchesRole =
      roleFilter === "ALL" ||
      (roleFilter === "WAITER" && w.role === "waiter") ||
      (roleFilter === "KITCHEN" && w.role === "kitchen");

    const matchesSearch =
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.employeeCode.toLowerCase().includes(search.toLowerCase()) ||
      (w.phone && w.phone.includes(search));

    return matchesRole && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-stone-900 flex items-center gap-2">
            <Users className="w-8 h-8 text-primary" />
            Restaurant Staff & Chef Management
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Create and manage accounts for Waiters (POS Floor) and Kitchen Chefs (KDS Screen).
          </p>
        </div>

        <button
          onClick={() => {
            setFeedback(null);
            setModalOpen(true);
          }}
          className="px-5 py-3 bg-orange-600 text-white font-black text-xs uppercase tracking-wider rounded-xl hover:bg-orange-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4 text-white" />
          Add Staff Member
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

      {/* Role Filter & Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex gap-2 w-full sm:w-auto">
          {(["ALL", "WAITER", "KITCHEN"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setRoleFilter(tab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                roleFilter === tab
                  ? "bg-stone-900 text-white shadow-sm"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {tab === "ALL" ? "All Staff" : tab === "WAITER" ? "Waiters" : "Kitchen Chefs"}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search by name, code, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
          />
        </div>
      </div>

      {/* Staff List Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="text-center py-16 text-stone-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-stone-300" />
            <p className="text-base font-bold text-stone-700">No staff members found</p>
            <p className="text-xs text-stone-400 mt-1">
              {search ? "Try refining your search" : "Click 'Add Staff Member' to create credentials for staff."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 uppercase text-stone-500 font-extrabold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Employee Code</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Phone / Contact</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                {filteredStaff.map((w) => (
                  <tr key={w.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="px-6 py-4">
                      {w.role === "kitchen" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded-lg font-black text-[11px]">
                          <ChefHat className="w-3.5 h-3.5" />
                          Chef
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-100 text-orange-800 border border-orange-300 rounded-lg font-black text-[11px]">
                          <UtensilsCrossed className="w-3.5 h-3.5" />
                          Waiter
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-black text-sm bg-stone-100 text-stone-900 border border-stone-200 px-2.5 py-1 rounded-lg">
                        {w.employeeCode}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-stone-900 text-sm">{w.name}</div>
                      {w.notes && <div className="text-[11px] text-stone-500 mt-0.5">{w.notes}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-stone-800 font-semibold">
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
                            : "bg-red-100 text-red-800 border border-red-200"
                        }`}
                      >
                        {w.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteStaff(w.id, w.name)}
                        disabled={deletingId === w.id}
                        className="p-2 hover:bg-red-50 text-stone-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        title="Delete account"
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

      {/* Add Staff Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-stone-200 animate-scale-in text-stone-900">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-stone-900">Add New Staff Member</h3>
                  <p className="text-xs text-stone-500">Create login credentials for restaurant staff</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-stone-400 hover:text-stone-900 p-1.5 rounded-lg hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4 pt-4">
              {/* Role Picker */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1.5">Staff Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setRole("WAITER");
                      if (!employeeCode || employeeCode.startsWith("CHEF-")) setEmployeeCode(`W-${staff.length + 1}`);
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                      role === "WAITER"
                        ? "bg-stone-900 border-stone-900 text-white shadow-md"
                        : "bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100"
                    }`}
                  >
                    <UtensilsCrossed className="w-4 h-4 text-orange-400" />
                    Waiter / Server
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRole("KITCHEN");
                      if (!employeeCode || employeeCode.startsWith("W-")) setEmployeeCode(`CHEF-${staff.length + 1}`);
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                      role === "KITCHEN"
                        ? "bg-stone-900 border-stone-900 text-white shadow-md"
                        : "bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100"
                    }`}
                  >
                    <ChefHat className="w-4 h-4 text-amber-400" />
                    Kitchen Chef
                  </button>
                </div>
              </div>

              {/* Full Name Input */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Full Name * <span className="text-[10px] text-stone-400 font-normal">(Letters only, no numbers)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Thapa"
                  value={name}
                  onChange={(e) => {
                    // Only allow letters, spaces, dots, hyphens
                    const filtered = e.target.value.replace(/[^a-zA-Z\s.'-]/g, "");
                    setName(filtered);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm font-semibold"
                />
              </div>

              {/* Employee Code & Phone Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Employee Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={role === "KITCHEN" ? "e.g. CHEF-1" : "e.g. W-101"}
                    value={employeeCode}
                    onChange={(e) => {
                      const filtered = e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 15);
                      setEmployeeCode(filtered);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm font-mono font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Phone Number * <span className="text-[10px] text-stone-400 font-normal">(10 digits starting with 9)</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="98XXXXXXXX"
                    value={phone}
                    onChange={(e) => {
                      // Only allow digits, max 10
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setPhone(digits);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm font-semibold font-mono"
                  />
                  {phone && !phone.startsWith("9") && (
                    <p className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Phone number must start with 9
                    </p>
                  )}
                  {phone && phone.startsWith("9") && phone.length < 10 && (
                    <p className="text-[11px] text-amber-600 font-medium mt-1">
                      {10 - phone.length} more digit{10 - phone.length > 1 ? "s" : ""} required (10 total)
                    </p>
                  )}
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Password *</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="password"
                    required
                    placeholder="Enter login password (min 6 chars)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm font-medium"
                  />
                </div>
              </div>

              {/* Email (Optional) */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Email <span className="text-[10px] text-stone-400 font-normal">(Optional, valid format e.g. name@gmail.com)</span>
                </label>
                <input
                  type="email"
                  placeholder="ramesh@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm font-medium"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Head chef / Evening shift server"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm font-medium"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 border border-stone-200 text-stone-600 font-bold text-xs rounded-xl hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-3 bg-orange-600 text-white font-black uppercase text-xs tracking-wider rounded-xl hover:bg-orange-500 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-600/20 disabled:opacity-50"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : "Save Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
