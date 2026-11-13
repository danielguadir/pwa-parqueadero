"use client";

import { useEffect } from "react";

export function SwRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("[PWA] Service Worker registrado exitosamente con scope:", registration.scope);
          })
          .catch((error) => {
            console.warn("[PWA] Error al registrar el Service Worker:", error);
          });
      });
    }
  }, []);

  return null;
}
