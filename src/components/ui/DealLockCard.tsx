"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { getDealLock, createCheckout, initiateSepaPayment } from "@/lib/api";
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
  const [payError, setPayError]   = useState<string | null>(null);
  const [paySuccess, setPaySuccess] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // SEPA form state
  const [showSepa, setShowSepa]         = useState(false);
  const [iban, setIban]                 = useState("");
  const [accountName, setAccountName]   = useState("");
  const [mandateAccepted, setMandate]   = useState(false);

  const sepaMutation = useMutation({
    mutationFn: () =>
      initiateSepaPayment(dealId, {
        iban: iban.replace(/\s/g, ""),
        account_name:     accountName,
        mandate_accepted: true,
      }),
    onSuccess: () => {
      setPaySuccess(
        "SEPA Direct Debit submitted. Your bank account will be debited within 5–8 business days."
      );
      setShowSepa(false);
    },
    onError: () => setPayError("SEPA payment error. Please try again or contact support."),
  });

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
      const gateway = (deal.payment_gateway as "safepay" | "bsecure" | "stripe") ?? "safepay";
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

      {payError   && <p className="text-sm text-red-600">{payError}</p>}
      {paySuccess  && <p className="text-sm text-green-700">{paySuccess}</p>}

      {canPay && !showSepa && (
        <div className="space-y-2">
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
            {checkoutLoading ? "Redirecting to payment…" : "Pay by Card"}
          </motion.button>

          {deal.currency === "EUR" && (
            <button
              onClick={() => setShowSepa(true)}
              className="w-full border border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-3 rounded-xl transition-colors text-sm cursor-pointer"
            >
              Pay via SEPA Direct Debit
            </button>
          )}
        </div>
      )}

      {/* SEPA Direct Debit form — EU only */}
      <AnimatePresence>
        {canPay && showSepa && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="space-y-3 rounded-xl border border-blue-100 bg-blue-50 p-4"
          >
            <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
              SEPA Direct Debit
            </p>

            <input
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              placeholder="IBAN (e.g. DE89 3704 0044 0532 0130 00)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-400"
            />

            <input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Account holder name"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400"
            />

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={mandateAccepted}
                onChange={(e) => setMandate(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              <span className="text-xs text-gray-600">
                I authorise RealTron AI to send instructions to my bank to debit my account in
                accordance with the SEPA Direct Debit mandate. I have the right to a refund
                within 8 weeks under the terms of my bank agreement.
              </span>
            </label>

            <div className="flex gap-2">
              <button
                onClick={() => { setShowSepa(false); setPayError(null); }}
                className="flex-1 rounded-lg border border-gray-300 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => sepaMutation.mutate()}
                disabled={!iban || !accountName || !mandateAccepted || sepaMutation.isPending}
                className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {sepaMutation.isPending ? "Submitting…" : "Confirm Debit"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
