import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { api, getGoogleAuthUrl } from "@/lib/api";
import { User, UtensilsCrossed, ChefHat, ShieldAlert, Zap, ShieldCheck, ShoppingBag } from "lucide-react";

export default function LoginPage() {
  const [roleTab, setRoleTab] = useState<"customer" | "waiter" | "kitchen">(
    "customer",
  );
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useUser();

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(errorParam.replace(/_/g, " "));
    }
    const roleParam = searchParams.get("role") || searchParams.get("tab");
    if (roleParam === "waiter" || roleParam === "kitchen") {
      setRoleTab(roleParam);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.auth.login({
        identifier: identifier.trim(),
        password,
      });

      if (res.success || res.user) {
        await refreshUser();
        const userRole = (res.user?.role || "").toLowerCase();
        if (userRole === "waiter" || userRole === "cashier") {
          navigate("/pos");
        } else if (userRole === "kitchen" || userRole === "chef") {
          navigate("/kitchen");
        } else if (userRole === "admin" || userRole === "super_admin") {
          navigate("/admin");
        } else {
          const from = searchParams.get("from") || searchParams.get("redirect");
          navigate(from || "/");
        }
      } else {
        setError((res as any).error || "Login failed");
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials or login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center py-8 sm:py-12 px-3 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-stone-200">
        {/* Role Switcher Tabs */}
        <div className="grid grid-cols-3 bg-stone-100 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl mb-6 gap-1">
          <button
            type="button"
            onClick={() => {
              setRoleTab("customer");
              setError("");
            }}
            className={`py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-tight sm:tracking-wider flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer select-none ${
              roleTab === "customer"
                ? "bg-white text-black shadow-sm"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">Customer</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRoleTab("waiter");
              setError("");
            }}
            className={`py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-tight sm:tracking-wider flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer select-none ${
              roleTab === "waiter"
                ? "bg-white text-black shadow-sm"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 shrink-0" />
            <span className="truncate">Waiter</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRoleTab("kitchen");
              setError("");
            }}
            className={`py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-tight sm:tracking-wider flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer select-none ${
              roleTab === "kitchen"
                ? "bg-white text-black shadow-sm"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            <ChefHat className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
            <span className="truncate">Chef</span>
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl mb-3 shadow-sm">
            {roleTab === "customer" ? (
              <User className="w-6 h-6" />
            ) : roleTab === "waiter" ? (
              <UtensilsCrossed className="w-6 h-6" />
            ) : (
              <ChefHat className="w-6 h-6" />
            )}
          </div>
          <h2 className="text-2xl font-black text-stone-900">
            {roleTab === "customer"
              ? "Customer Sign In"
              : roleTab === "waiter"
                ? "Waiter Staff Portal"
                : "Kitchen Chef Portal"}
          </h2>
          <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
            {roleTab === "customer"
              ? "Sign in or create account with Google for 1-click access to ordering and tracking"
              : roleTab === "waiter"
                ? "Sign in to access table ordering & POS terminal"
                : "Sign in to access live Kitchen Display System (KDS)"}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border border-red-200 mb-5">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* CUSTOMER VIEW: PURE OAUTH ONLY (NO FORM) */}
        {roleTab === "customer" ? (
          <div className="flex flex-col gap-4">
            <a
              href={getGoogleAuthUrl(searchParams.get("redirect") || searchParams.get("from") || "")}
              className="w-full flex items-center justify-center gap-3 bg-white text-stone-800 font-black border-2 border-stone-200 py-3.5 px-4 rounded-2xl hover:bg-stone-50 hover:border-orange-300 hover:shadow-md transition-all text-sm shadow-sm cursor-pointer group"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path
                    fill="#4285F4"
                    d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
                  />
                  <path
                    fill="#34A853"
                    d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
                  />
                </g>
              </svg>
              <span>Continue with Google</span>
            </a>

            {/* Feature Perks */}
            <div className="mt-4 p-4 bg-stone-50 rounded-2xl border border-stone-100 flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-stone-700">
                <Zap className="w-4 h-4 text-orange-500 shrink-0" />
                <span>1-Click Instant Sign-In • No passwords needed</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-stone-700">
                <ShoppingBag className="w-4 h-4 text-orange-500 shrink-0" />
                <span>Fast checkout & live real-time order tracking</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-stone-700">
                <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
                <span>100% Secure authentication via Google</span>
              </div>
            </div>

            <p className="text-[11px] text-stone-400 text-center mt-2 leading-relaxed">
              By continuing, you agree to Gole Khaja Ghar's{" "}
              <Link to="/terms" className="underline hover:text-stone-600">Terms of Service</Link>{" "}
              and{" "}
              <Link to="/privacy-policy" className="underline hover:text-stone-600">Privacy Policy</Link>.
            </p>
          </div>
        ) : (
          /* STAFF VIEW (WAITER / CHEF): EMPLOYEE CODE LOGIN FORM */
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Employee Code, Phone or Email
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 text-sm font-semibold transition-all"
                placeholder={
                  roleTab === "waiter"
                    ? "e.g. W-101 or 98XXXXXXXX"
                    : "e.g. CHEF-1 or 98XXXXXXXX"
                }
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 text-sm font-semibold transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 text-white font-black uppercase text-xs tracking-wider py-3.5 rounded-xl hover:bg-orange-500 transition-all mt-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-orange-600/25"
            >
              {loading
                ? "Signing in..."
                : roleTab === "waiter"
                  ? "Login to POS Terminal"
                  : "Login to Kitchen Screen"}
            </button>

            <div className="mt-2 p-3 bg-stone-50 rounded-xl border border-stone-100 text-center text-xs text-stone-500">
              Staff accounts are created by Super Admin. Please contact
              management for employee credentials.
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
