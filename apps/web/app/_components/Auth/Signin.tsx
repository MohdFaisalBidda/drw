"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, Paintbrush, Sparkles } from "lucide-react";
import Link from "next/link";
import { styles } from "../../../styles/shared";
import { toast } from "@/hooks/use-toast";

function SigninPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
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
                <label htmlFor="email" className={styles.inputLabel}>
                  Email
                </label>
                <input
                  id="email"
                  type="text"
                  name="email"
                  value={userData.email}
                  onChange={handleOnChange}
                  className={styles.input}
                  placeholder="biddafaisal@gmail.com"
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
                {!isLoading ? (
                  "Sign In"
                ) : (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                )}
              </button>
            </form>

            <p className="text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/sign-up" className={styles.link}>
                Sign up
              </Link>
            </p>
          </div>

          {/* Features */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <Feature
              icon={<Sparkles className="w-4 h-4 text-purple-600" />}
              title="Real-time Drawing"
              desc="Draw and collaborate with others in real-time"
            />
            <Feature
              icon={<Sparkles className="w-4 h-4 text-purple-600" />}
              title="Multiple Rooms"
              desc="Join different rooms for various projects"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const Feature = ({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) => (
  <div className="p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-white/20">
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <h3 className="font-medium">{title}</h3>
    </div>
    <p className="text-sm text-gray-600">{desc}</p>
  </div>
);

export default SigninPage;
