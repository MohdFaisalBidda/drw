"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";
import { UserProvider } from "./UserProvider";
import Header from "@/app/_components/Header";

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <UserProvider>{children}</UserProvider>
    </SessionProvider>
  );
}

export default Providers;
