"use client";

import React, { useState } from "react";
import { SigninAction } from "../../../actions";
import { useRouter } from "next/navigation";
import { Paintbrush, Sparkles } from "lucide-react";
import Link from "next/link";
import { styles } from "../../../styles/shared";
import { useUser } from "../../../provider/UserProvider";

function Signin() {
  const { user, setUser } = useUser();
  const router = useRouter();
  const [userData, setUserData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => {
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userData.username && userData.password) {
      const res = await SigninAction(userData);
      console.log(res, "res");
      if (res) {
        localStorage.setItem("token", res.token);
        setUser({ token: res.token, ...res.user });
        router.push("/");
      }
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
              <Paintbrush className="w-8 h-8 text-white" />
            </div>
            <h1>Welcome Back</h1>
            <p className={styles.subheading}>Sign in to continue drawing</p>
          </div>

          {/* Sign In Form */}
          <div className={`${styles.card} p-8 space-y-6`}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className={styles.inputLabel}>
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  name="username"
                  value={userData.username}
                  onChange={handleOnChange}
                  className={styles.input}
                  placeholder="Faisal"
                />
              </div>

              <div>
                <label htmlFor="password" className={styles.inputLabel}>
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={userData.password}
                  onChange={handleOnChange}
                  className={styles.input}
                  placeholder="••••••••"
                />
              </div>

              {error && <div className={styles.error}>{error}</div>}

              <button type="submit" className={styles.button.primary}>
                Sign In
              </button>
            </form>
            {/* 
            <div className="relative">
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
              Don't have an account?{" "}
              <Link href="/sign-up" className={styles.link}>
                Sign up
              </Link>
            </p>
          </div>

          {/* Features Preview */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <h3 className="font-medium">Real-time Drawing</h3>
              </div>
              <p className="text-sm text-gray-600">
                Draw and collaborate with others in real-time
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <h3 className="font-medium">Multiple Rooms</h3>
              </div>
              <p className="text-sm text-gray-600">
                Join different rooms for various projects
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signin;
