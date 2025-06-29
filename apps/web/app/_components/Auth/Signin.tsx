"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  LogIn,
  Mail,
  Paintbrush,
  PenTool,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { styles } from "../../../styles/shared";
import { toast } from "@/hooks/use-toast";

function SigninPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/join";
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [userData, setUserData] = useState({
    email: "",
    password: "",
  });

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      setError(decodeURIComponent(error));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!userData.email || !userData.password) {
      setError("Please fill in both fields.");
      return;
    }

    setError("");
    setIsLoading(true);

    const result = await signIn("credentials", {
      email: userData.email,
      password: userData.password,
      redirect: false,
    });

    setIsLoading(false);

    if (result?.error) {
      console.log(result.error, "Sign-in error");

      toast({
        title: "Sign-in failed",
        description: "Invalid email or password",
        variant: "destructive",
      });
      setError("Invalid credentials");
      return;
    }

    // Success
    toast({
      title: "Signed in successfully",
    });

    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "#202025" }}
    >
      {/* Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-xl mx-auto px-6">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-2xl mb-4 transform hover:scale-105 transition-transform duration-200">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
            <p className="text-gray-400">Sign in to your Drw account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={userData.email}
                    onChange={handleOnChange}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={userData.password}
                    onChange={handleOnChange}
                    className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Guest Access */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#202025] text-gray-400">or</span>
              </div>
            </div>

            <button
              onClick={()=>router.push("/drw")}
              className="w-full mt-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <PenTool className="w-4 h-4" />
              <span>Try without login</span>
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{" "}
              <button
                onClick={() => router.push("/sign-up")}
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors duration-200"
              >
                Sign up
              </button>
            </p>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => router.push("/")}
              className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
            >
              ← Back to home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default SigninPage;
