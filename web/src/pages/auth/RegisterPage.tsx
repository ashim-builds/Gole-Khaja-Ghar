import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
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

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const NAME_REGEX = /^[a-zA-Z\s]{2,60}$/;
  const PHONE_REGEX = /^9\d{9}$/;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let cleanValue = value;

    if (name === "name") {
      cleanValue = value.replace(/[^a-zA-Z\s]/g, "");
    } else if (name === "phone") {
      cleanValue = value.replace(/\D/g, "").slice(0, 10);
    } else if (name === "email") {
      cleanValue = value.replace(/\s/g, "");
    }

    setFormData((prev) => ({ ...prev, [name]: cleanValue }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!NAME_REGEX.test(formData.name.trim())) {
      errors.name = "Name must only contain letters and spaces (2–60 characters, no numbers).";
    }
    if (formData.phone && !PHONE_REGEX.test(formData.phone.replace(/[\s\-]/g, ""))) {
      errors.phone = "Phone number must be exactly 10 digits and start with 9 (e.g. 9812345678).";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const res = await api.auth.register(formData);

      if (res.success || res.user) {
        await refreshUser();
        navigate("/shop");
      } else {
        setError((res as any).error || "Registration failed");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto bg-white p-8 rounded-xl shadow-sm border border-stone-100">
        <h2 className="text-center text-3xl font-black text-black mb-6">Create Account</h2>

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm font-medium">{error}</div>}

          <div>
            <label className="block text-sm font-bold text-stone-700 mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 text-stone-900 placeholder:text-stone-400 bg-stone-50 font-medium text-sm transition-all ${
                fieldErrors.name ? "border-red-400 bg-red-50" : "border-stone-200"
              }`}
              placeholder="Ram Bahadur"
            />
            {fieldErrors.name ? (
              <p className="text-xs text-red-500 font-medium mt-1">{fieldErrors.name}</p>
            ) : (
              <p className="text-xs text-stone-400 mt-1">Letters and spaces only (no numbers)</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 font-medium text-sm transition-all"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-700 mb-1">Phone Number (Optional)</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              maxLength={10}
              className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 text-stone-900 placeholder:text-stone-400 bg-stone-50 font-medium text-sm transition-all ${
                fieldErrors.phone ? "border-red-400 bg-red-50" : "border-stone-200"
              }`}
              placeholder="9812345678"
            />
            {fieldErrors.phone ? (
              <p className="text-xs text-red-500 font-medium mt-1">{fieldErrors.phone}</p>
            ) : (
              <p className="text-xs text-stone-400 mt-1">10 digits, starting with 9 (e.g. 9812345678)</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 font-medium text-sm transition-all"
              placeholder="••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 text-white font-black uppercase text-sm tracking-wider py-3.5 rounded-xl hover:bg-orange-500 transition-all mt-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-orange-600/25"
          >
            {loading ? "Creating Account..." : "Register"}
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-stone-500 font-medium">Or continue with</span>
            </div>
          </div>

          <a
            href="/api/auth/google"
            className="w-full flex items-center justify-center gap-3 bg-white text-stone-700 font-bold border border-stone-200 py-3 rounded-md hover:bg-stone-50 transition-colors"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
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
        </form>

        <div className="mt-6 text-center text-sm text-stone-600">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-primary hover:underline">
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
}
