import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, Loader2, ArrowLeft, Home } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { api } from "@/lib/api";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const navigate = useNavigate();
  const { refreshUser } = useUser();

  // Check if admin is already logged in
  useEffect(() => {
    let active = true;
    async function checkExistingAuth() {
      try {
        const res = await api.orders.getAdminLiveUpdates();
        if (res && res.success && active) {
          navigate("/admin", { replace: true });
          return;
        }
      } catch {
        // Not authenticated
      } finally {
        if (active) {
          setIsCheckingAuth(false);
        }
      }
    }
    checkExistingAuth();
    return () => {
      active = false;
    };
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.auth.adminLogin(password);
      if (res.success) {
        await refreshUser();
        navigate("/admin", { replace: true });
      } else {
        setError("Invalid password");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111111]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-stone-400 text-sm font-semibold">Checking session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f5f5] px-4 py-8 relative">
      {/* Top Floating Back to Home button */}
      <div className="w-full max-w-md mb-4 flex justify-between items-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-stone-100 text-stone-700 font-bold rounded-xl border border-stone-200 shadow-sm text-xs transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-orange-600" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-stone-100">
        <div className="bg-[#111111] p-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 relative rounded-full overflow-hidden border-2 border-orange-500 bg-stone-900 mb-4 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <img
              src="/images/logo.png"
              alt="Gole Khaja Ghar Logo"
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes('favicon-circle.png')) {
                  target.src = '/favicon-circle.png';
                }
              }}
            />
          </div>
          <h1 className="text-2xl font-black text-white">
            Gole Khaja Ghar Admin
          </h1>
          <p className="text-stone-400 text-sm mt-1">Secure Dashboard Access</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-500 text-sm font-bold p-3 rounded-lg text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-stone-900 pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white font-semibold placeholder:text-stone-400 transition-all"
                  placeholder="Enter password..."
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-orange-600 text-white font-black rounded-xl hover:bg-orange-500 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-orange-600/25 cursor-pointer text-sm uppercase tracking-wider"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin text-white" />
                  Authenticating...
                </>
              ) : (
                "Login to Dashboard"
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-stone-100 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Return to Customer Storefront</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
