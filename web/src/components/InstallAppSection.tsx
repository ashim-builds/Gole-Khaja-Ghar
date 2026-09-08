import React, { useState, useEffect } from "react";
import {
  Download,
  Smartphone,
  CheckCircle2,
  Zap,
  BellRing,
  Sparkles,
  Share2,
} from "lucide-react";

export default function InstallAppSection() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    // Check if already installed in standalone mode
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const useStoredInstallPrompt = () => {
      const storedPrompt = (window as any).__gkgDeferredInstallPrompt;
      if (storedPrompt) setDeferredPrompt(storedPrompt);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("gkg-install-prompt-ready", useStoredInstallPrompt);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setInstallSuccess(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("gkg-install-prompt-ready", useStoredInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isInstalled) return;

    const installPrompt = deferredPrompt || (window as any).__gkgDeferredInstallPrompt;
    if (installPrompt) {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") {
        setInstallSuccess(true);
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      (window as any).__gkgDeferredInstallPrompt = null;
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // Fallback for browsers where beforeinstallprompt was already fired or not supported directly
      alert(
        "To install Gole Khaja Ghar App:\n1. Click your browser menu (⋮ or share icon)\n2. Select 'Install App' or 'Add to Home screen'"
      );
    }
  };

  return (
    <section className="py-12 md:py-20 bg-gradient-to-b from-stone-900 to-[#111111] text-white relative overflow-hidden">
      {/* Decorative Glow Background */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-orange-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-stone-950/80 border border-white/10 rounded-3xl p-6 sm:p-10 md:p-14 shadow-2xl backdrop-blur-xl flex flex-col lg:flex-row items-center justify-between gap-10">
          {/* Left Column: Information & Value Props */}
          <div className="flex-1 max-w-2xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-black uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Official Gole Khaja App
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight leading-tight mb-4">
              Install App For <span className="text-primary">Faster Khaja</span>
            </h2>

            <p className="text-stone-300 text-sm sm:text-base leading-relaxed mb-8">
              Get the full app experience on your phone or desktop. Instant 1-tap ordering, live order tracking push alerts, and faster food delivery without downloading from the App Store!
            </p>

            {/* Feature Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 text-left">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-white">1-Tap Ordering</h3>
                  <p className="text-[11px] text-stone-400 mt-0.5">Instant menu access from home screen</p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-white">Live Push Alerts</h3>
                  <p className="text-[11px] text-stone-400 mt-0.5">Real-time cooking & delivery status</p>
                </div>
              </div>
            </div>

            {/* Install Button & Feedback */}
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              {isInstalled || installSuccess ? (
                <div className="px-8 py-4 rounded-2xl bg-green-500/20 border border-green-500/40 text-green-400 font-black text-sm uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  App Installed & Active
                </div>
              ) : (
                <button
                  onClick={handleInstallClick}
                  className="w-full sm:w-auto px-8 py-4 bg-orange-600 text-white font-black text-sm uppercase tracking-wider rounded-2xl hover:bg-orange-500 transition-all transform active:scale-95 shadow-xl shadow-orange-600/30 flex items-center justify-center gap-3 cursor-pointer group"
                >
                  <Download className="w-5 h-5 text-white transition-transform group-hover:-translate-y-0.5" />
                  Install Gole Khaja App
                </button>
              )}

              <span className="text-xs text-stone-400 font-medium">
                Free • Works on Android, iOS & PC
              </span>
            </div>

            {/* iOS Guide Modal / Box */}
            {showIOSGuide && (
              <div className="mt-6 p-4 bg-orange-950/60 border border-orange-700/40 rounded-2xl text-left animate-in fade-in">
                <div className="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-wider mb-1">
                  <Share2 className="w-4 h-4" />
                  Install on iPhone / iPad (Safari)
                </div>
                <ol className="text-xs text-stone-300 space-y-1 list-decimal list-inside">
                  <li>Tap the <strong>Share</strong> icon (square with arrow up) at the bottom of Safari.</li>
                  <li>Scroll down and tap <strong>"Add to Home Screen"</strong>.</li>
                  <li>Tap <strong>"Add"</strong> at the top right.</li>
                </ol>
              </div>
            )}
          </div>

          {/* Right Column: Visual Mockup Phone Card */}
          <div className="w-full lg:w-auto flex justify-center">
            <div className="relative w-64 sm:w-72 bg-gradient-to-b from-stone-900 to-black p-4 rounded-[2.5rem] border-4 border-stone-700 shadow-2xl shadow-orange-600/20">
              {/* Speaker Notch */}
              <div className="w-24 h-4 bg-stone-800 rounded-full mx-auto mb-4" />

              {/* App Screen Preview */}
              <div className="bg-[#111111] rounded-2xl p-4 border border-white/10 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto border-2 border-orange-500/40 bg-stone-900 shadow-md">
                  <img
                    src="/favicon-circle.png"
                    alt="Gole Khaja Ghar App Icon"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <h4 className="font-black text-white text-base">Gole Khaja Ghar</h4>
                  <p className="text-[11px] text-orange-400 font-bold uppercase tracking-wider mt-0.5">
                    Fast Food & Authentic Khaja
                  </p>
                </div>

                <div className="py-2.5 px-3 bg-white/5 rounded-xl border border-white/10 text-[11px] text-stone-300 flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
                  Live Delivery Ready
                </div>

                <button
                  onClick={handleInstallClick}
                  className="w-full py-3 bg-orange-600 text-white font-black text-xs uppercase tracking-wider rounded-xl hover:bg-orange-500 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-600/25"
                >
                  <Smartphone className="w-4 h-4 text-white" />
                  {isInstalled ? "Open App" : "Add to Home Screen"}
                </button>
              </div>

              {/* Home Indicator */}
              <div className="w-32 h-1 bg-stone-700 rounded-full mx-auto mt-4" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
