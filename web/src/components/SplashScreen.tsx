import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    const duration = 500; 
    const intervalTime = 15;
    const step = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + step;
      });
    }, intervalTime);

    const fadeTimeout = setTimeout(() => {
      setVisible(false);
    }, 700);

    const removeTimeout = setTimeout(() => {
      setShouldRender(false);
    }, 1200);

    return () => {
      clearInterval(timer);
      clearTimeout(fadeTimeout);
      clearTimeout(removeTimeout);
    };
  }, []);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-stone-950 flex flex-col items-center justify-center transition-all duration-700 ease-out select-none ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none scale-105"
      }`}
    >
      <div className="relative flex flex-col items-center max-w-xs w-full px-6 text-center">
        
        {/* Golden spinning backdrop circles */}
        <div className="absolute w-44 h-44 rounded-full border-2 border-dashed border-primary/20 animate-[spin_15s_linear_infinite]" />
        <div className="absolute w-36 h-36 rounded-full border border-primary/30 animate-[spin_8s_linear_infinite_reverse]" />
        
        {/* Pulsing Logo Container */}
        <div className="w-28 h-28 relative rounded-full overflow-hidden border-2 border-primary/40 shadow-2xl shadow-primary/30 mb-8 animate-[pulse_1.8s_ease-in-out_infinite]">
          <img
            src="/images/logo.png"
            alt="Golu Khaja Ghar Splash Logo"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Brand Text */}
        <h1 className="text-2xl font-black text-white tracking-widest uppercase mb-1">
          Golu <span className="text-primary">Khaja Ghar</span>
        </h1>
        <p className="text-stone-400 font-bold text-xs uppercase tracking-widest mb-6">
          Authentic · Fresh · Delicious
        </p>

        {/* Custom loading progress bar */}
        <div className="w-40 h-1 bg-stone-800 rounded-full overflow-hidden relative">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
