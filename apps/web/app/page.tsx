"use client";

import React, { useState, useEffect } from "react";
import {
  PenTool,
  Users,
  Zap,
  Share2,
  Download,
  Play,
  Check,
  ArrowRight,
  Menu,
  X,
  MousePointer,
  Cloud,
  Globe,
  Lock,
  Layers,
  Sparkles,
  Github,
  Mail,
  Twitter,
} from "lucide-react";
import Link from "next/link";
import { appName } from "@/utils";
import Header from "./_components/Header";
import Image from "next/image";
import Footer from "./_components/Footer";

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    {
      icon: PenTool,
      title: "Natural Drawing",
      description:
        "Create fluid, hand-drawn strokes that feel authentic and organic for natural diagram creation",
    },
    {
      icon: Users,
      title: "Real-time Collaboration",
      description:
        "Work together seamlessly with live cursors and instant updates across all team members",
    },
    {
      icon: Zap,
      title: "Instant Sync",
      description:
        "Zero-latency synchronization ensures everyone stays in sync across all devices",
    },
    // {
    //   icon: Layers,
    //   title: "Smart Organization",
    //   description:
    //     "Organize complex diagrams with intelligent layering and grouping capabilities",
    // },
    // {
    //   icon: Globe,
    //   title: "Cloud Native",
    //   description:
    //     "Access your work from anywhere with reliable cloud-based architecture",
    // },
    // {
    //   icon: Lock,
    //   title: "Enterprise Security",
    //   description:
    //     "Bank-grade encryption and security measures keep your ideas protected",
    // },
  ];

  return (
    <div
      className="min-h-screen text-white"
      style={{ backgroundColor: "#202025" }}
    >
      {/* Subtle Background Elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-20 right-20 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      <Header />
      {/* Hero Section */}
      <section className="relative z-10 pt-24 pb-16 lg:pt-32 lg:pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-gray-300">
                Now with Real Time Collaboration
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-white">
              Collaborative Whiteboard
              <br />
              <span className="text-purple-400">for Visual Creativity</span>
            </h1>

            <p className="text-lg lg:text-xl text-gray-400 leading-relaxed max-w-3xl mx-auto">
              Draw, sketch, and brainstorm together in real-time. Designed for
              seamless visual collaboration—whether you're working with
              colleagues, classmates, or friends.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
              <Link href="/drw">
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2">
                  <span>Try now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>

              <Link
                href={"#demo"}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-200"
              >
                <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center">
                  <Play className="w-4 h-4 ml-0.5" />
                </div>
                <span>Watch Demo</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Preview */}
      <section id="demo" className="relative z-10 py-16">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="aspect-video rounded-xl flex items-center justify-center relative overflow-hidden">
            <video
              src="/drw.mp4"
              autoPlay
              loop
              muted
              className="w-full h-full absolute top-0 left-0"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white">
              Everything you need for
              <span className="text-purple-400"> visual collaboration</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Powerful features designed for teams who think visually
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors duration-200"
              >
                <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-purple-400" />
                </div>

                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>

                <p className="text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 lg:p-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Ready to start collaborating?
            </h2>

            <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of teams creating amazing diagrams with
              SketchBoard. Start your free trial today.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200">
                Try without login
              </button>

              <button className="border border-white/20 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/5 transition-colors duration-200">
                Sign in
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default App;
