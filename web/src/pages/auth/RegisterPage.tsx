import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { api, getGoogleAuthUrl } from "@/lib/api";
import { Mail, ArrowLeft, RefreshCw, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const [step, setStep] = useState<"form" | "otp">("form");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // OTP State
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useUser();

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(errorParam.replace(/_/g, " "));
    }
  }, [searchParams]);

  // Cooldown timer for resending OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [resendCooldown]);

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
    if (!formData.password || formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const res = await api.auth.register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || undefined,
        password: formData.password,
      });

      if (res.otpSent || res.success) {
        setStep("otp");
        setResendCooldown(60);
        setSuccessMessage(res.message || `Verification code sent to ${formData.email.trim().toLowerCase()}`);
        setTimeout(() => {
          otpInputsRef.current[0]?.focus();
        }, 150);
      } else {
        setError(res.message || "Registration failed. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
      return;
    }

    // Handle paste of multiple characters
    if (cleaned.length > 1) {
      const digits = cleaned.slice(0, 6).split("");
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      const nextIdx = Math.min(index + digits.length, 5);
      otpInputsRef.current[nextIdx]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = cleaned[0];
    setOtp(newOtp);

    // Auto-advance to next input
    if (index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasteData) return;

    const digits = pasteData.split("");
    const newOtp = [...otp];
    digits.forEach((d, i) => {
      newOtp[i] = d;
    });
    setOtp(newOtp);
    const focusIdx = Math.min(digits.length, 5);
    otpInputsRef.current[focusIdx]?.focus();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Please enter the complete 6-digit verification code");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await api.auth.verifyOtp(formData.email.trim().toLowerCase(), otpCode);
      if (res.success || res.user) {
        await refreshUser();
        const redirectParam = searchParams.get("redirect") || searchParams.get("from");
        navigate(redirectParam || "/shop");
      } else {
        setError((res as any).error || "Verification failed");
      }
    } catch (err: any) {
      setError(err.message || "Invalid or expired verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return;
    setError("");
    setSuccessMessage("");
    setResending(true);

    try {
      const res = await api.auth.resendOtp(formData.email.trim().toLowerCase());
      if (res.success) {
        setResendCooldown(60);
        setSuccessMessage(res.message || "New verification code has been sent!");
        setOtp(["", "", "", "", "", ""]);
        otpInputsRef.current[0]?.focus();
      } else {
        setError(res.message || "Failed to resend verification code");
      }
    } catch (err: any) {
      setError(err.message || "Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto bg-white p-8 rounded-3xl shadow-sm border border-stone-200">
        {step === "form" ? (
          <>
            <div className="text-center mb-6">
              <h2 className="text-3xl font-black text-black">Create Account</h2>
              <p className="text-xs text-stone-500 mt-1">
                Join Gole Khaja Ghar for fast ordering and exclusive deals
              </p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 text-stone-900 placeholder:text-stone-400 bg-stone-50 font-semibold text-sm transition-all ${
                    fieldErrors.name ? "border-red-400 bg-red-50" : "border-stone-200"
                  }`}
                  placeholder="Ram Bahadur"
                />
                {fieldErrors.name ? (
                  <p className="text-xs text-red-500 font-medium mt-1">{fieldErrors.name}</p>
                ) : (
                  <p className="text-[11px] text-stone-400 mt-1">Letters and spaces only (no numbers)</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 font-semibold text-sm transition-all"
                  placeholder="your@email.com"
                />
                <p className="text-[11px] text-stone-400 mt-1">We will send a 6-digit verification code to this email</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  maxLength={10}
                  className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 text-stone-900 placeholder:text-stone-400 bg-stone-50 font-semibold text-sm transition-all ${
                    fieldErrors.phone ? "border-red-400 bg-red-50" : "border-stone-200"
                  }`}
                  placeholder="9812345678"
                />
                {fieldErrors.phone ? (
                  <p className="text-xs text-red-500 font-medium mt-1">{fieldErrors.phone}</p>
                ) : (
                  <p className="text-[11px] text-stone-400 mt-1">10 digits starting with 9</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 text-stone-900 placeholder:text-stone-400 bg-stone-50 font-semibold text-sm transition-all ${
                    fieldErrors.password ? "border-red-400 bg-red-50" : "border-stone-200"
                  }`}
                  placeholder="••••••••"
                />
                {fieldErrors.password && (
                  <p className="text-xs text-red-500 font-medium mt-1">{fieldErrors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 text-white font-black uppercase text-xs tracking-wider py-3.5 rounded-xl hover:bg-orange-500 transition-all mt-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-orange-600/25 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sending Verification Code...
                  </>
                ) : (
                  "Continue to Email Verification"
                )}
              </button>

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
                href={getGoogleAuthUrl(searchParams.get("redirect") || searchParams.get("from") || "")}
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
            </form>

            <div className="mt-6 text-center text-xs text-stone-600">
              Already have an account?{" "}
              <Link to="/login" className="font-bold text-primary hover:underline">
                Login here
              </Link>
            </div>
          </>
        ) : (
          /* Step 2: OTP Verification Screen */
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => {
                setStep("form");
                setError("");
                setSuccessMessage("");
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors mb-4 cursor-pointer self-start"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to registration
            </button>

            <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-7 h-7" />
            </div>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-black">Verify Your Email</h2>
              <p className="text-xs text-stone-500 mt-2">
                We sent a 6-digit verification code to
              </p>
              <p className="text-sm font-black text-stone-900 mt-0.5">
                {formData.email}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 border border-red-200 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 text-green-700 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 border border-green-200 mb-4">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
              {/* 6 OTP Input Boxes */}
              <div className="flex justify-between gap-2 sm:gap-2.5">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputsRef.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={idx === 0 ? handleOtpPaste : undefined}
                    className="w-12 h-14 sm:w-13 sm:h-15 text-center text-2xl font-black rounded-2xl border-2 border-stone-200 bg-stone-50 text-stone-900 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading || otp.join("").length !== 6}
                className="w-full bg-orange-600 text-white font-black uppercase text-xs tracking-wider py-3.5 rounded-xl hover:bg-orange-500 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-orange-600/25 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Verify & Create Account
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-stone-500">
                Didn't receive the code?
              </p>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || resending}
                className="mt-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 disabled:text-stone-400 disabled:cursor-not-allowed inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                {resending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Resending...
                  </>
                ) : resendCooldown > 0 ? (
                  `Resend Code in ${resendCooldown}s`
                ) : (
                  "Resend Code"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
