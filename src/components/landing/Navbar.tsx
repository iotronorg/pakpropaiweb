"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Features", href: "#features" },
    { label: "For Buyers", href: "#clients" },
    { label: "For Agents", href: "#agents" },
  ];

  return (
    <motion.nav
      initial={prefersReduced ? false : { y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="font-bold text-lg tracking-tight text-gray-900">
            PakProp<span className="text-emerald-600"> AI</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-gray-600 hover:text-emerald-700 transition-colors duration-150 font-medium cursor-pointer"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-150 font-medium px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            Sign In
          </Link>
          <a
            href="#register"
            className="text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 rounded-xl transition-colors duration-150 shadow-sm cursor-pointer"
          >
            Join as Agent
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-gray-600 hover:text-gray-900 transition-colors cursor-pointer p-1"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="md:hidden bg-white border-t border-gray-100 shadow-lg px-6 py-5 flex flex-col gap-4"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-gray-700 hover:text-emerald-700 text-sm font-medium transition-colors cursor-pointer"
            >
              {link.label}
            </a>
          ))}
          <hr className="border-gray-100" />
          <Link href="/login" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
            Sign In
          </Link>
          <a
            href="#register"
            onClick={() => setMenuOpen(false)}
            className="text-sm font-semibold text-white bg-emerald-600 px-4 py-3 rounded-xl text-center cursor-pointer"
          >
            Join as Agent
          </a>
        </motion.div>
      )}
    </motion.nav>
  );
}
