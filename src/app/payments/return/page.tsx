"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getDealLock } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatPKR, roleHomePath } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { DealLock } from "@/types";

export default function PaymentReturnPage() {
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
  }, [isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
        {/* Icon */}
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
          isSuccess ? "bg-green-100" : "bg-red-100"
        }`}>
          <span className="text-4xl">
            {isSuccess ? "✅" : isCancelled ? "❌" : "⚠️"}
          </span>
        </div>

        {/* Title */}
        <h1 className={`text-2xl font-bold mb-2 ${
          isSuccess ? "text-green-700" : "text-red-700"
        }`}>
          {isSuccess
            ? "Payment Successful"
            : isCancelled
            ? "Payment Cancelled"
            : "Payment Status Unknown"}
        </h1>

        {/* Deal details */}
        {deal && (
          <div className="bg-gray-50 rounded-xl p-4 my-5 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Property</span>
              <span className="font-medium text-gray-900">{deal.property_title}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">City</span>
              <span className="text-gray-700">{deal.property_city}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Token Amount</span>
              <span className="font-semibold text-gray-900">{formatPKR(deal.token_amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Gateway</span>
              <span className="text-gray-700 capitalize">{deal.payment_gateway}</span>
            </div>
            {deal.payment_ref && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Reference</span>
                <span className="font-mono text-xs text-gray-600">{deal.payment_ref}</span>
              </div>
            )}
          </div>
        )}

        {/* Message */}
        <p className="text-sm text-gray-600 mb-6">
          {isSuccess
            ? "Your token payment has been received. The deal lock is now active. Both parties will be notified via WhatsApp."
            : isCancelled
            ? "Your payment was not completed. No amount has been charged. You can retry from your dashboard."
            : "We could not confirm your payment status. Please contact support if you were charged."}
        </p>

        {/* Redirect notice */}
        <p className="text-xs text-gray-400 mb-4">
          Redirecting to dashboard in {countdown}s…
        </p>

        <button
          onClick={() => router.replace(roleHomePath(user?.role ?? "agent"))}
          className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors ${
            isSuccess
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-800 text-white hover:bg-gray-900"
          }`}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
