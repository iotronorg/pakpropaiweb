"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCookieConsent } from "@/hooks/useCookieConsent";

export function CookieConsentBanner() {
  const { hasDecided, accept } = useCookieConsent();

  return (
    <AnimatePresence>
      {!hasDecided && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
          role="dialog"
          aria-label="Cookie consent"
        >
          <div className="mx-auto max-w-3xl rounded-2xl bg-gray-900 px-6 py-5 shadow-2xl border border-gray-700">
            <p className="text-sm text-gray-300 mb-4 leading-relaxed">
              We use essential cookies to keep your session secure. We also use optional analytics
              cookies to understand how you use our platform and improve it.{" "}
              <Link href="/privacy-policy" className="text-indigo-400 hover:underline">
                Privacy Policy
              </Link>
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => accept("all")}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                Accept All
              </button>
              <button
                onClick={() => accept("essential")}
                className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Essential Only
              </button>
              <Link
                href="/privacy-policy"
                className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Manage
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
