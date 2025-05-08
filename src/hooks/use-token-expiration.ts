"use client";

import { useEffect, useRef } from "react";
import { useAuthData } from "@/entities/auth/model/use-auth-store";
import { useNavigate } from "react-router-dom";

// Token expiration time in milliseconds (1 hour)
const TOKEN_EXPIRATION_TIME = 60 * 60 * 1000;

export function useTokenExpiration() {
  const navigate = useNavigate();
  const token = useAuthData((state) => state.token);
  const removeToken = useAuthData((state) => state.removeToken);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Function to handle logout
  const handleLogout = () => {
    removeToken();
    navigate("/login");
  };

  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // If we have a token, set up the expiration timer
    if (token) {
      timerRef.current = setTimeout(() => {
        console.log("Token expired after 1 hour, logging out");
        handleLogout();
      }, TOKEN_EXPIRATION_TIME);
    }

    // Cleanup on unmount or when token changes
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [token, removeToken, navigate]);

  return null;
}
