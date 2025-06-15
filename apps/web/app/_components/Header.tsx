"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu, PenTool, UserIcon, X } from "lucide-react";
import { appName } from "@/utils";

export default function Header() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [scrollY, setScrollY] = React.useState(0);

  React.useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const user = session?.user;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrollY > 50
          ? "bg-[#202025]/90 backdrop-blur-xl border-b border-white/5"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <PenTool className="w-5 h-5 text-white" />
              </div>
              <span className="text-3xl font-bagel-fat font-semibold text-white">
                {appName}
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="#features"
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              Features
            </a>
            <a
              href="#demo"
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              Demo
            </a>
            {user ? (
              <div className="flex items-center space-x-4">
                <Link href="/join">
                  <button className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-6 py-2 rounded-lg font-medium transition-colors duration-200">
                    Join Room
                  </button>
                </Link>
                <button
                  onClick={() => signOut()}
                  className="bg-red-500/50 hover:bg-red-500 text-white text-sm font-medium border border-red-400/30 transition-colors duration-200 px-6 py-2 rounded-lg"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <Link href="/sign-in">
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200">
                  Sign In
                </button>
              </Link>
            )}
          </nav>

          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#202025]/95 backdrop-blur-xl border-b border-white/5">
          <div className="px-6 py-6 space-y-4">
            <a
              href="#features"
              className="block py-2 text-gray-400 hover:text-white transition-colors"
            >
              Features
            </a>
            <a
              href="#demo"
              className="block py-2 text-gray-400 hover:text-white transition-colors"
            >
              Demo
            </a>
            {user ? (
              <div className="flex flex-col space-y-4">
                <Link href="/join">
                  <button className="bg-purple-600 hover:bg-purple-700 w-full text-white text-sm px-6 py-2 rounded-lg font-medium transition-colors duration-200">
                    Join Room
                  </button>
                </Link>
                <button
                  onClick={() => signOut()}
                  className="bg-red-500/50 hover:bg-red-500 text-white text-sm font-medium border border-red-400/30 transition-colors duration-200 px-6 py-2 rounded-lg"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <Link href="/sign-in">
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200">
                  Sign In
                </button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
