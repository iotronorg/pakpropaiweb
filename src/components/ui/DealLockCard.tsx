"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { getDealLock, createCheckout } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import type { DealLock, DealLockStatus } from "@/types";

interface DealLockCardProps {
  dealId: string;
}

function formatCountdown(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

const STATUS_BADGE: Record<DealLockStatus, { label: string; cls: string }> = {
  initiated: { label: "Awaiting Payment", cls: "bg-amber-100 text-amber-800" },
  locked:    { label: "Reserved",          cls: "bg-green-100 text-green-800" },
  expired:   { label: "Expired",           cls: "bg-red-100 text-red-800" },
  cancelled: { label: "Cancelled",         cls: "bg-gray-100 text-gray-500" },
  released:  { label: "Released",          cls: "bg-gray-100 text-gray-500" },
  disputed:  { label: "Disputed",          cls: "bg-orange-100 text-orange-800" },
};

export function DealLockCard({ dealId }: DealLockCardProps) {
  const { user } = useAuthStore();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: deal, isLoading } = useQuery<DealLock>({
    queryKey: ["deal-lock", dealId],
    queryFn: () => getDealLock(dealId).then((r) => r.data as DealLock),
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!deal || deal.status !== "locked" || !deal.lock_expires_at) {
      setSecondsLeft(null);
      return;
    }
    const calc = () =>
      Math.max(
        0,
        Math.floor((new Date(deal.lock_expires_at!).getTime() - Date.now()) / 1000)
      );
    setSecondsLeft(calc());
    timerRef.current = setInterval(() => setSecondsLeft(calc()), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [deal?.lock_expires_at, deal?.status]);

  const handlePay = async () => {
    if (!deal) return;
    setCheckoutLoading(true);
    setPayError(null);
    try {
      const gateway = (deal.payment_gateway as "safepay" | "bsecure") ?? "safepay";
      const res = await createCheckout(dealId, gateway);
      window.location.href = res.data.checkout_url;
    } catch {
      setPayError("Payment gateway error. Please try again or contact support.");
      setCheckoutLoading(false);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse h-48 w-full max-w-md bg-gray-100 rounded-2xl" />;
  }

  if (!deal) {
    return (
      <p className="text-sm text-red-500">Deal not found. Check the link and try again.</p>
    );
  }

  const badge = STATUS_BADGE[deal.status] ?? {
    label: deal.status,
    cls: "bg-gray-100 text-gray-600",
  };

  const canPay = deal.status === "initiated" && user?.phone === deal.buyer_phone;

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 space-y-5 max-w-md w-full">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-semibold text-gray-900 text-lg leading-snug">
          {deal.property_title}
        </h2>
        <motion.span
          key={deal.status}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full ${badge.cls}`}
        >
          {badge.label}
        </motion.span>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <dt className="text-gray-500">City</dt>
        <dd className="font-medium text-gray-900">{deal.property_city}</dd>

        <dt className="text-gray-500">Token Amount</dt>
        <dd className="font-semibold text-gray-900">
          {deal.currency} {deal.token_amount.toLocaleString()}
        </dd>

        <dt className="text-gray-500">Gateway</dt>
        <dd className="font-medium text-gray-900 capitalize">
          {deal.payment_gateway || "—"}
        </dd>

        {deal.payment_ref && (
          <>
            <dt className="text-gray-500">Reference</dt>
            <dd className="font-mono text-xs text-gray-600 truncate">{deal.payment_ref}</dd>
          </>
        )}
      </dl>

      <AnimatePresence>
        {deal.status === "locked" && secondsLeft !== null && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="bg-green-50 border border-green-100 rounded-xl p-4 text-center"
          >
            <p className="text-xs font-medium text-green-600 mb-1">
              Exclusivity window expires in
            </p>
            <p
              data-testid="countdown"
              className="text-2xl font-mono font-bold text-green-700 tabular-nums"
            >
              {formatCountdown(secondsLeft)}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {payError && <p className="text-sm text-red-600">{payError}</p>}

      {canPay && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handlePay}
          disabled={checkoutLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          {checkoutLoading && (
            <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {checkoutLoading ? "Redirecting to payment…" : "Pay Token Amount"}
        </motion.button>
      )}
    </div>
  );
}
