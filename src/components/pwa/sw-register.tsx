"use client";

import { useEffect } from "react";

export function SwRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Diagnóstico de contexto seguro (W3C: Service Workers requieren HTTPS o localhost)
    const esContextoSeguro = window.isSecureContext;
    if (!esContextoSeguro) {
      console.warn(
        "[PWA] Contexto no seguro detectado. En celulares conectados por IP (http://192.168.x.x:3000), " +
        "Chrome y Safari desactivan Service Workers por seguridad W3C. " +
        "Para usar offline en el celular, usa HTTPS o activa 'Insecure origins treated as secure' en chrome://flags."
      );
    }

    // Solicitar almacenamiento persistente para evitar que el navegador limpie IndexedDB
    if (navigator.storage && typeof navigator.storage.persist === "function") {
      navigator.storage.persist().then((persistido) => {
        if (persistido) {
          console.log("[Storage] Almacenamiento persistente garantizado por el navegador.");
        }
      }).catch(() => {});
    }

    if (!("serviceWorker" in navigator)) {
      console.warn("[PWA] Service Worker no disponible en este navegador o contexto.");
      return;
    }

    const registrar = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          console.log("[PWA] Service Worker registrado exitosamente con scope:", registration.scope);
        })
        .catch((error) => {
          console.warn("[PWA] Error al registrar el Service Worker:", error);
        });
    };

    if (document.readyState === "complete" || document.readyState === "interactive") {
      registrar();
    } else {
      window.addEventListener("load", registrar, { once: true });
    }
  }, []);

  return null;
}
