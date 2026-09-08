import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Prevent multi-touch pinch-to-zoom and gesture zooming across mobile browsers / webviews
if (typeof window !== "undefined") {
  // Keep Android's native install prompt available until an install button consumes it.
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    (window as any).__gkgDeferredInstallPrompt = event;
    window.dispatchEvent(new Event("gkg-install-prompt-ready"));
  });

  window.addEventListener("appinstalled", () => {
    (window as any).__gkgDeferredInstallPrompt = null;
  });

  // Prevent Safari gesture zooming (pinch in/out)
  document.addEventListener("gesturestart", (e) => e.preventDefault());
  document.addEventListener("gesturechange", (e) => e.preventDefault());
  document.addEventListener("gestureend", (e) => e.preventDefault());

  // Prevent multi-touch pinch zoom on touchmove
  document.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  // Prevent double-tap zoom on non-interactive elements
  let lastTouchEnd = 0;
  document.addEventListener(
    "touchend",
    (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        const target = e.target as HTMLElement | null;
        const isInput =
          target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.tagName === "SELECT" ||
            target.isContentEditable);
        if (!isInput) {
          e.preventDefault();
        }
      }
      lastTouchEnd = now;
    },
    { passive: false }
  );
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

