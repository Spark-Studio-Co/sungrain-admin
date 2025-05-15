// hooks/use-auto-logout.ts
import { useEffect, useRef } from "react";
import { useAuthData } from "@/entities/auth/model/use-auth-store";

const INACTIVITY_TIMEOUT = 1000 * 60 * 60; // 1 час

export function useAutoLogout() {
  const logout = useAuthData.getState().removeToken;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      console.warn("⏱️ Auto-logout after inactivity");
      logout();
      window.location.href = "/login";
    }, INACTIVITY_TIMEOUT);
  };

  useEffect(() => {
    const events = ["mousemove", "keydown", "scroll", "click"];

    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer(); // запустить в момент монтирования

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);
}
