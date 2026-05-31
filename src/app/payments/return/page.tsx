"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getDealLock } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { roleHomePath, formatCurrency } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { DealLock } from "@/types";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

function PaymentReturnContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const status = params.get("status") ?? "unknown";
  const dealId = params.get("deal_id");

  const [countdown, setCountdown] = useState(10);

  const isSuccess = status === "success";
  const isCancelled = status === "cancelled" || status === "failed";

  const { data: deal, isLoading } = useQuery({
    queryKey: ["deal-return", dealId],
    queryFn: () => getDealLock(dealId!).then((r) => r.data as DealLock),
    enabled: !!dealId,
  });

  useEffect(() => {
    if (isLoading) return;
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          router.replace(roleHomePath(user?.role ?? "agent"));
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isLoading, router, user?.role]);

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[var(--bg-base)]">
        <LoadingSpinner />
      </div>
    );
  }

  const StatusIcon = isSuccess ? CheckCircle2 : isCancelled ? XCircle : AlertTriangle;
  const iconColor  = isSuccess ? "text-emerald-500" : isCancelled ? "text-red-500" : "text-amber-500";
  const iconBg     = isSuccess ? "bg-emerald-50 border border-emerald-100" : isCancelled ? "bg-red-50 border border-red-100" : "bg-amber-50 border border-amber-100";

  return (
    <div className="min-h-dvh bg-[var(--bg-base)] flex items-center justify-center p-4">
      <div
        role="main"
        aria-live="polite"
        aria-atomic="true"
        className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-lg max-w-md w-full p-8 text-center"
      >
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${iconBg}`} aria-hidden="true">
          <StatusIcon size={40} className={iconColor} />
        </div>

        <h1 className={`text-2xl font-bold mb-2 ${
          isSuccess ? "text-emerald-700" : isCancelled ? "text-red-700" : "text-amber-700"
        }`}>
          {isSuccess
            ? "Payment Successful"
            : isCancelled
            ? "Payment Cancelled"
            : "Payment Status Unknown"}
        </h1>

        {deal && (
          <div className="bg-[var(--bg-muted)] rounded-xl p-4 my-5 text-start space-y-2" role="region" aria-label="Deal summary">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">Property</span>
              <span className="font-medium text-[var(--text-primary)]">{deal.property_title}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">City</span>
              <span className="text-[var(--text-muted)]">{deal.property_city}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">Token Amount</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {formatCurrency(deal.token_amount, deal.currency)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">Gateway</span>
              <span className="text-[var(--text-muted)] capitalize">{deal.payment_gateway}</span>
            </div>
            {deal.payment_ref && (
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">Reference</span>
                <span className="font-mono text-xs text-[var(--text-muted)]">{deal.payment_ref}</span>
              </div>
            )}
          </div>
        )}

        <p className="text-sm text-[var(--text-muted)] mb-4">
          {isSuccess
            ? "Your token payment has been received. The deal lock is now active. Both parties will be notified via WhatsApp."
            : isCancelled
            ? "Your payment was not completed. No amount has been charged. You can retry from your dashboard."
            : "We could not confirm your payment status. Please contact support if you were charged."}
        </p>

        <p aria-live="polite" className="text-xs text-[var(--text-muted)] mb-4">
          Redirecting to dashboard in {countdown}s…
        </p>

        <button
          type="button"
          onClick={() => router.replace(roleHomePath(user?.role ?? "agent"))}
          className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
            isSuccess
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-slate-800 text-white hover:bg-slate-900"
          }`}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center bg-[var(--bg-base)]">
        <LoadingSpinner />
      </div>
    }>
      <PaymentReturnContent />
    </Suspense>
  );
}
