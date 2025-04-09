"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { UserIcon } from "lucide-react";

export default function Header() {
  const router = useRouter();
  const { data: session } = useSession();

  const user = session?.user;

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b shadow-sm bg-white">
      {/* Logo */}
      <Link href="/" className="text-xl font-bold text-primary">
        DrawSync
      </Link>

      {/* Right: Avatar + Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="cursor-pointer h-9 w-9">
            {/* {user?.image ? (
              <AvatarImage src={user.image} alt={user.name ?? "User"} />
            ) : ( */}
            {/* )} */}
            <AvatarFallback>
              {user?.name ? (
                user.name.charAt(0).toUpperCase()
              ) : (
                <UserIcon className="w-5 h-5" />
              )}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-44">
          {user ? (
            <>
              <DropdownMenuLabel>Hello, {user.name}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {/* <DropdownMenuItem onClick={() => router.push("/profile")}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                Settings
              </DropdownMenuItem> */}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/create-room")}>
                Create Room
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => signOut()}>
                Logout
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem onClick={() => router.push("/sign-in")}>
                Login
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/sign-up")}>
                Register
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
