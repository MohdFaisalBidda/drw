"use client";

import { useSession } from "next-auth/react";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import jwt from "jsonwebtoken";

const userContext = createContext<any>(null);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status, update } = useSession();
  const [user, setUser] = useState<any>(null);

  // Properly memoized token check function with all dependencies
  const checkToken = useCallback(async () => {
    if (status !== "authenticated" || !session?.accessToken) return;

    try {
      const decoded = jwt.decode(session.accessToken) as { exp?: number };

      // If token expires in less than 1 hour or is already expired
      if (!decoded?.exp || decoded.exp * 1000 < Date.now() + 3600000) {
        // 1 hour = 3600000 ms
        console.log("Token about to expire, updating...");
        await update();
      }
    } catch (err) {
      console.error("Token check failed:", err);
    }
  }, [status, session?.accessToken, update]);

  useEffect(() => {
    // Update user when session changes
    if (status === "authenticated" && session?.user) {
      setUser(session.user);
    }
  }, [session?.user, status]);

  useEffect(() => {
    if (status === "authenticated") {
      // Initial check
      checkToken();
    }
  }, [checkToken, status]);

  return (
    <userContext.Provider value={{ user }}>{children}</userContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(userContext);
  return context || { user: null }; // Safe default
};
