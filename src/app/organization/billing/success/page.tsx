"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

const PLAN_LABELS: Record<string, string> = {
  basic:        "Basic",
  professional: "Professional",
  enterprise:   "Enterprise",
};

function BillingSuccessContent() {
  const router    = useRouter();
  const params    = useSearchParams();
  const qc        = useQueryClient();
  const plan      = params.get("plan") ?? "";
  const planLabel = PLAN_LABELS[plan] ?? plan;

  useEffect(() => {
    qc.invalidateQueries({ queryKey: ["billing-usage"] });
    qc.invalidateQueries({ queryKey: ["my-organization"] });
  }, [qc]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-6">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">
        {planLabel ? `Welcome to ${planLabel}!` : "Upgrade successful!"}
      </h1>
      <p className="mt-2 max-w-md text-sm text-gray-500">
        Your subscription is now active. Your new plan limits are effective immediately —
        enjoy more agents, listings, and WhatsApp AI capacity.
      </p>

      <div className="mt-8 flex gap-3">
        <Link
          href="/organization"
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Go to dashboard
        </Link>
        <Link
          href="/organization/settings"
          className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          View settings
        </Link>
      </div>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense>
      <BillingSuccessContent />
    </Suspense>
  );
}
