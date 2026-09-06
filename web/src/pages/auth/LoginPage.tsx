import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { api } from "@/lib/api";
import { User, UtensilsCrossed, ShieldAlert } from "lucide-react";

export default function LoginPage() {
  const [roleTab, setRoleTab] = useState<"customer" | "waiter">("customer");
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
        const from = searchParams.get("from");
        navigate(from || "/");
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
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto bg-white p-8 rounded-2xl shadow-sm border border-stone-200">
        {/* Role Switcher Tabs */}
        <div className="flex bg-stone-100 p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setRoleTab("customer");
              setError("");
            }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              roleTab === "customer"
                ? "bg-white text-black shadow-sm"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            <User className="w-4 h-4" />
            Customer
          </button>

          <button
            type="button"
            onClick={() => {
              setRoleTab("waiter");
              setError("");
            }}
            className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              roleTab === "waiter"
                ? "bg-white text-black shadow-sm"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            <UtensilsCrossed className="w-4 h-4 text-primary" />
            Waiter Staff
          </button>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-black">
            {roleTab === "customer" ? "Customer Login" : "Waiter Staff Portal"}
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            {roleTab === "customer"
              ? "Welcome back to Gole Khaja Ghar"
              : "Sign in with your staff credentials"}
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border border-red-200">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
              {roleTab === "customer" ? "Email or Phone" : "Employee Code, Phone or Email"}
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-primary text-black text-sm font-medium"
              placeholder={roleTab === "customer" ? "your@email.com or 98XXXXXXXX" : "e.g. W-101 or 98XXXXXXXX"}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-primary text-black text-sm font-medium"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-black font-black uppercase text-xs tracking-wider py-3.5 rounded-xl hover:bg-primary/90 transition-all mt-2 disabled:opacity-50 cursor-pointer shadow-md shadow-primary/20"
          >
            {loading ? "Signing in..." : roleTab === "customer" ? "Login as Customer" : "Login as Waiter"}
          </button>

          {roleTab === "customer" ? (
            <>
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-stone-400 font-bold uppercase tracking-wider">
                    Or continue with
                  </span>
                </div>
              </div>

              <a
                href="/api/auth/google"
                className="w-full flex items-center justify-center gap-3 bg-white text-stone-700 font-bold border border-stone-200 py-3 rounded-xl hover:bg-stone-50 transition-colors text-xs"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
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
                Google
              </a>

              <div className="mt-4 text-center text-xs text-stone-600">
                Don't have an account?{" "}
                <Link to="/register" className="font-bold text-primary hover:underline">
                  Register here
                </Link>
              </div>
            </>
          ) : (
            <div className="mt-4 p-3 bg-stone-50 rounded-xl border border-stone-100 text-center text-xs text-stone-500">
              Waiter accounts cannot register online. Please contact the Super Admin for your credentials.
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
