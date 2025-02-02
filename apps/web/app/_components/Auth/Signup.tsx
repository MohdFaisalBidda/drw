"use client";

import React, { useState } from "react";
import { createUser } from "../../../actions";
import { Palette, Users, Zap } from "lucide-react";
import Link from "next/link";
import { styles } from "../../../styles/shared";
import { useRouter } from "next/navigation";

function Signup() {
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const router = useRouter();

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userData.username && userData.email && userData.password) {
      const res = await createUser(userData);
      localStorage.setItem("token", res.data?.token);
      router.push("/join-room");
    } else {
      setError("Please fill in all fields");
    }
  };

  return (
    <div className={styles.gradientBg}>
      <div className={styles.container}>
        <div className="max-w-md mx-auto">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 mb-4">
              <Palette className="w-8 h-8 text-white" />
            </div>
            <h1>Start Creating</h1>
            <p className={styles.subheading}>
              Join our creative community today
            </p>
          </div>

          {/* Sign Up Form */}
          <div className={`${styles.card} p-8 space-y-6`}>
            <form onSubmit={handleSignUp} className="space-y-6">
              <div>
                <label htmlFor="name" className={styles.inputLabel}>
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={userData.username}
                  onChange={handleOnChange}
                  className={styles.input}
                  placeholder="Faisal"
                />
              </div>

              <div>
                <label htmlFor="email" className={styles.inputLabel}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={userData.email}
                  onChange={handleOnChange}
                  className={styles.input}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className={styles.inputLabel}>
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={userData.password}
                  onChange={handleOnChange}
                  className={styles.input}
                  placeholder="••••••••"
                />
              </div>

              {error && <div className={styles.error}>{error}</div>}

              <button type="submit" className={styles.button.primary}>
                Create Account
              </button>
            </form>

            {/* <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <button className={styles.button.secondary}>
              <span className="flex items-center justify-center gap-2">
                Continue with Google
              </span>
            </button> */}

            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/sign-in" className={styles.link}>
                Sign in
              </Link>
            </p>
          </div>

          {/* Features Grid */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-purple-600" />
                <h3 className="font-medium">Collaborate</h3>
              </div>
              <p className="text-sm text-gray-600">
                Work together with your team in real-time
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-purple-600" />
                <h3 className="font-medium">Fast & Smooth</h3>
              </div>
              <p className="text-sm text-gray-600">
                Enjoy a lag-free drawing experience
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
