"use client";
import { motion } from "motion/react";
import { FeatureBentoGrid } from "./_components/FeatureBentoGrid";
import { UserButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Home() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-x-hidden">
      <Navbar />

      {/* Decorative side borders — hidden on small screens to avoid clutter */}
      <div className="hidden sm:block absolute inset-y-0 left-0 h-full w-px bg-neutral-200/80 dark:bg-neutral-800/80">
        <div className="absolute top-0 h-40 w-px bg-gradient-to-b from-transparent via-blue-500 to-transparent" />
      </div>
      <div className="hidden sm:block absolute inset-y-0 right-0 h-full w-px bg-neutral-200/80 dark:bg-neutral-800/80">
        <div className="absolute h-40 w-px bg-gradient-to-b from-transparent via-blue-500 to-transparent" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px w-full bg-neutral-200/80 dark:bg-neutral-800/80">
        <div className="absolute mx-auto h-px w-40 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
      </div>

      {/* Hero Section */}
      <div className="px-4 sm:px-8 py-10 sm:py-16 md:py-20 w-full max-w-5xl mx-auto text-center">
        <h1 className="relative z-10 mx-auto max-w-4xl text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-slate-700 dark:text-slate-300 leading-tight">
          {"🧠 Transform Healthcare with AI Medical Voice Agents"
            .split(" ")
            .map((word, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.08,
                  ease: "easeInOut",
                }}
                className="mr-2 inline-block"
              >
                {word}
              </motion.span>
            ))}
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.8 }}
          className="relative z-10 mx-auto max-w-xl py-4 sm:py-6 text-sm sm:text-base md:text-lg font-normal text-neutral-600 dark:text-neutral-400 px-2"
        >
          Provide 24/7 intelligent medical support using conversational AI. Triage
          symptoms, book appointments, and deliver empathetic care with voice-first
          automation.
        </motion.p>

        <Link href="/dashboard">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 1 }}
            className="relative z-10 mt-4 sm:mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <button className="w-48 sm:w-60 transform rounded-lg bg-black px-6 py-2.5 font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 text-sm sm:text-base">
              Get Started
            </button>
          </motion.div>
        </Link>
      </div>
    </div>
  );
}

const Navbar = () => {
  const { user } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="w-full border-b border-neutral-200 dark:border-neutral-800 bg-background/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex w-full items-center justify-between px-4 sm:px-8 md:px-12 lg:px-20 py-3 sm:py-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="logo"
            width={180}
            height={90}
            className="w-24 sm:w-32 md:w-44 h-auto"
          />
        </div>

        {/* Desktop right side */}
        <div className="hidden sm:flex items-center gap-3 sm:gap-4">
          {!user ? (
            <Link href="/dashboard">
              <button className="w-20 sm:w-28 transform rounded-lg bg-black px-4 sm:px-6 py-2 font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 text-sm">
                Login
              </button>
            </Link>
          ) : (
            <div className="flex gap-3 items-center">
              <UserButton />
              <Link href="/dashboard">
                <Button size="sm">Dashboard</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile: show UserButton + hamburger */}
        <div className="flex sm:hidden items-center gap-2">
          {user && <UserButton />}
          <button
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-border bg-background px-4 py-3 flex flex-col gap-2 animate-in slide-in-from-top-2 duration-200">
          {!user ? (
            <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
              <button className="w-full rounded-lg bg-black px-4 py-2.5 font-medium text-white text-sm">
                Login / Get Started
              </button>
            </Link>
          ) : (
            <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
              <Button className="w-full">Go to Dashboard</Button>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};
