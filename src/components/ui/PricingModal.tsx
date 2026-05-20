"use client";

import { useState } from "react";
import { createBillingCheckout } from "@/lib/api";

interface Plan {
  slug: "basic" | "professional" | "enterprise";
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

const PLANS: Plan[] = [
  {
    slug: "basic",
    name: "Basic",
    price: "$49",
    period: "/month",
    description: "For small agencies getting started",
    features: [
      "10 agents",
      "200 property listings",
      "5,000 WhatsApp AI turns/month",
      "Campaign management",
      "CRM & lead routing",
      "Email support",
    ],
  },
  {
    slug: "professional",
    name: "Professional",
    price: "$149",
    period: "/month",
    description: "For growing real estate organizations",
    features: [
      "50 agents",
      "2,000 property listings",
      "50,000 WhatsApp AI turns/month",
      "Everything in Basic",
      "AI lead scoring",
      "Advanced analytics",
      "Priority support",
    ],
    highlighted: true,
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large developers and brokerages",
    features: [
      "Unlimited agents",
      "Unlimited listings",
      "Unlimited WhatsApp AI turns",
      "Everything in Professional",
      "Dedicated onboarding",
      "SLA & uptime guarantee",
      "Custom integrations",
    ],
  },
];

interface Props {
  currentPlan: string;
  onClose: () => void;
}

export function PricingModal({ currentPlan, onClose }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError]     = useState<string | null>(null);

  async function handleUpgrade(plan: Plan) {
    if (plan.slug === "enterprise") {
      window.open("mailto:sales@realtron.ai?subject=Enterprise%20Plan%20Inquiry", "_blank");
      return;
    }
    setLoading(plan.slug);
    setError(null);
    try {
      const res = await createBillingCheckout(plan.slug);
      const url = res.data?.checkout_url;
      if (url) window.location.href = url;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? "Something went wrong. Please try again.");
      setLoading(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-8 pt-8 pb-4 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Upgrade your plan</h2>
            <p className="mt-1 text-sm text-gray-500">
              Scale your real estate operations with more agents, listings, and AI capacity.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-xl font-light ml-4 mt-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mx-8 mb-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Plan cards */}
        <div className="px-8 pb-8 grid grid-cols-1 md:grid-cols-3 gap-5 mt-4">
          {PLANS.map((plan) => {
            const isCurrent = plan.slug === currentPlan;
            const isLoading = loading === plan.slug;

            return (
              <div
                key={plan.slug}
                className={`relative flex flex-col rounded-xl border p-6 transition-shadow ${
                  plan.highlighted
                    ? "border-blue-500 shadow-lg shadow-blue-100 ring-1 ring-blue-500"
                    : "border-gray-200 hover:shadow-md"
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-[11px] font-bold text-white uppercase tracking-wide">
                    Most Popular
                  </span>
                )}

                <div className="mb-4">
                  <h3 className="text-base font-semibold text-gray-900">{plan.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{plan.description}</p>
                </div>

                <div className="mb-5 flex items-end gap-0.5">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period && (
                    <span className="text-sm text-gray-400 mb-1">{plan.period}</span>
                  )}
                </div>

                <ul className="flex-1 space-y-2.5 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="mt-0.5 text-blue-500 shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan)}
                  disabled={isCurrent || !!loading}
                  className={`w-full rounded-lg py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isCurrent
                      ? "bg-gray-100 text-gray-500 cursor-default"
                      : plan.highlighted
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  {isCurrent
                    ? "Current plan"
                    : isLoading
                    ? "Redirecting…"
                    : plan.slug === "enterprise"
                    ? "Contact sales"
                    : `Upgrade to ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
