"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";

const links = {
  Platform: [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Features", href: "#features" },
    { label: "AI Capabilities", href: "#ai" },
    { label: "WhatsApp Automation", href: "#whatsapp" },
  ],
  "For Organizations": [
    { label: "Developers & Agencies", href: "#developers" },
    { label: "Sales Teams", href: "#agents" },
    { label: "Register Organization", href: "/register" },
  ],
  "For Agents & Clients": [
    { label: "Join as Agent", href: "/register" },
    { label: "For Buyers & Investors", href: "#clients" },
    { label: "Try on WhatsApp", href: "https://wa.me/923000000000" },
  ],
  Account: [
    { label: "Sign In", href: "/login" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
};

export default function LandingFooter() {
  return (
    <footer className="bg-gray-900 border-t border-white/8 px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          {/* Brand col */}
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span className="font-bold text-lg tracking-tight text-white">
                RealTron<span className="text-emerald-400"> AI</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs mb-6">
              AI Sales Infrastructure for Real Estate Developers, Agencies, and Brokerages.
              Automate leads, qualify buyers, and close deals via WhatsApp.
            </p>
            <a
              href="https://wa.me/923000000000"
              className="inline-flex items-center gap-2 bg-[#25D366]/15 border border-[#25D366]/25 text-[#25D366] rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-[#25D366]/25 transition-colors duration-150"
            >
              <MessageCircle size={15} />
              Try on WhatsApp
            </a>
          </div>

          {/* Link groups */}
          {Object.entries(links).map(([group, items]) => (
            <div key={group}>
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">
                {group}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {items.map(({ label, href }) => (
                  <li key={label}>
                    {href.startsWith("http") ? (
                      <a href={href} className="text-sm text-gray-400 hover:text-white transition-colors duration-150">{label}</a>
                    ) : href.startsWith("#") ? (
                      <a href={href} className="text-sm text-gray-400 hover:text-white transition-colors duration-150">{label}</a>
                    ) : (
                      <Link href={href} className="text-sm text-gray-400 hover:text-white transition-colors duration-150">{label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} RealTron AI. All rights reserved.
          </p>
          <p className="text-xs text-gray-600">
            Enterprise AI Sales Infrastructure · WhatsApp-First · Global-Ready
          </p>
        </div>
      </div>
    </footer>
  );
}
