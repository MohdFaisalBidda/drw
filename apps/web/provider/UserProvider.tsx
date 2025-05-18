"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { createContext, use, useContext, useEffect, useState } from "react";

const userContext = createContext<any>(null);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { data: session, status } = useSession();
  console.log(session, status, "session in user provider");

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
    }
    console.log(session?.user, "session.user in useEffect");
    
    setUser(session?.user); // ✅ only store the user object
  }, [session, status]);

  return (
    <userContext.Provider value={{ user, setUser }}>
      {children}
    </userContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(userContext);
  if (!context) {
    return { user: null, setUser: () => {} }; // safe fallback
  }
  console.log(context, "context in useUser");

  return context;
};
