"use client";

import Link from "next/link";
import { MessageCircle, Phone } from "lucide-react";

const WHATSAPP_NUMBER = "923000000000";
const WHATSAPP_DISPLAY = "+92 300 0000000";

const links = {
  Platform: [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Features", href: "#features" },
    { label: "For Buyers & Sellers", href: "#clients" },
    { label: "For Agents", href: "#agents" },
    { label: "For Developers", href: "#developers" },
  ],
  Account: [
    { label: "Sign In", href: "/login" },
    { label: "Agent Registration", href: "#register" },
  ],
  Legal: [
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
              AI Sales Infrastructure for Real Estate Developers &amp; Agencies.
              Automate leads, qualify buyers, and close deals via WhatsApp.
            </p>

            {/* Contact */}
            <div className="flex flex-col gap-2.5">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                className="inline-flex items-center gap-2 bg-[#25D366]/15 border border-[#25D366]/25 text-[#25D366] rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-[#25D366]/25 transition-colors duration-150"
              >
                <MessageCircle size={15} />
                Chat on WhatsApp
              </a>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Phone size={13} />
                <span>{WHATSAPP_DISPLAY}</span>
              </div>
            </div>
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
                    {href.startsWith("#") ? (
                      <a
                        href={href}
                        className="text-sm text-gray-400 hover:text-white transition-colors duration-150"
                      >
                        {label}
                      </a>
                    ) : (
                      <Link
                        href={href}
                        className="text-sm text-gray-400 hover:text-white transition-colors duration-150"
                      >
                        {label}
                      </Link>
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
            Pakistan&apos;s First AI Real Estate Assistant · WhatsApp-First
          </p>
        </div>
      </div>
    </footer>
  );
}
