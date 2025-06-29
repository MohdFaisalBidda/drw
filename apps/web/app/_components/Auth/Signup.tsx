"use client";

import React, { useState } from "react";
import { createUser } from "../../../actions";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Palette,
  PenTool,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { styles } from "../../../styles/shared";
import { useRouter } from "next/navigation";
import { useUser } from "../../../provider/UserProvider";
import { signIn } from "next-auth/react";
import { toast } from "@/hooks/use-toast";

function Signup() {
  const { setUser } = useUser();
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const validateForm = () => {
    const { username, email, password } = userData;

    if (!username || !email || !password) {
      setError("All fields are required.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return false;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return false;
    }

    if (userData.password !== userData.confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }

    setError(""); // Clear any existing errors
    return true;
  };

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const res = await createUser(userData);

      if (!res.success) {
        toast({
          title: "Sign up failed",
          description: "Please try again later",
          variant: "destructive",
        });
        return;
      }

      const result = await signIn("credentials", {
        email: userData.username, // double-check this — should this be `email` instead?
        password: userData.password,
        redirect: false,
      });

      if (result?.ok) {
        toast({
          title: "Welcome!",
          description: "Account created successfully",
        });
        router.push("/join-room");
      } else {
        toast({
          title: "Login failed",
          description:
            "Signup succeeded but auto-login failed. Please try manually.",
          variant: "destructive",
        });
        router.push("/sign-in");
      }
    } catch (err) {
      console.error("Signup error:", err);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12"
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
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Create your account
            </h1>
            <p className="text-gray-400">
              Join Drw and start collaborating
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignUp} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  User Name
                </label>
                <input
                  id="username"
                  type="text"
                  name="username"
                  value={userData.username}
                  onChange={handleOnChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your username"
                  required
                />
              </div>

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
                    placeholder="Create a password"
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

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Confirm password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={userData.confirmPassword}
                    onChange={handleOnChange}
                    className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {showConfirmPassword ? (
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
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

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
              Already have an account?{" "}
              <button
                onClick={() => router.push("/sign-in")}
                className="text-purple-400 hover:text-purple-300 font-medium transition-colors duration-200"
              >
                Sign in
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

export default Signup;
