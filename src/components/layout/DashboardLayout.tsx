"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { useAuthStore } from "@/store/auth";
import { ChevronRight, Menu, X } from "lucide-react";

function Breadcrumb({ pathname }: { pathname: string }) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
      {segments.map((seg, i) => {
        const label = seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        const isLast = i === segments.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={11} className="text-[var(--text-faint)] rtl:rotate-180" aria-hidden="true" />}
            <span className={isLast ? "font-medium text-[var(--text-primary)]" : ""}>
              {label}
            </span>
          </span>
        );
      })}
    </nav>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile nav is open
  useEffect(() => {
    if (mobileNavOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileNavOpen]);

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--bg-base)]">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden lg:block shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={() => setMobileNavOpen(false)}
              aria-hidden="true"
            />
            {/* Drawer */}
            <motion.div
              key="drawer"
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 start-0 z-50 lg:hidden"
            >
              <Sidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-surface)] px-4 sm:px-6 py-3 min-h-[49px] shrink-0">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileNavOpen((v) => !v)}
            className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-muted)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
            aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileNavOpen}
          >
            {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <Breadcrumb pathname={pathname} />

          <div className="flex items-center gap-3 ms-auto">
            <NotificationBell />
            <div className="h-4 w-px bg-[var(--border)]" aria-hidden="true" />
            <span className="text-xs text-[var(--text-muted)] hidden sm:block">{user?.phone}</span>
          </div>
        </header>

        {/* Page content */}
        <main id="main-content" className="flex-1 overflow-y-auto">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="p-4 sm:p-6"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
