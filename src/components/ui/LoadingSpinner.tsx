"use client";

import { motion } from "framer-motion";

export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dim = { sm: 16, md: 32, lg: 48 }[size];
  return (
    <div className="flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        style={{ width: dim, height: dim }}
        className="rounded-full border-2 border-slate-200 border-t-sky-500"
      />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="shimmer h-7 w-48 rounded-lg" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="shimmer h-3 w-20 rounded" />
            <div className="shimmer mt-4 h-8 w-14 rounded" />
            <div className="shimmer mt-2 h-2.5 w-16 rounded" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-white p-6 space-y-4 shadow-sm">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="shimmer h-4 rounded w-full" />
        ))}
      </div>
    </div>
  );
}
