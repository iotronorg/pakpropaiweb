"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { getBillingInvoices, getBillingPortal } from "@/lib/api";
import type { BillingInvoice } from "@/types";

function fmtDate(unix: number) {
  return new Date(unix * 1000).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function fmtAmount(amount: number, currency: string) {
  return `${currency} ${(amount / 100).toLocaleString("en", { minimumFractionDigits: 2 })}`;
}

const STATUS_STYLES: Record<string, string> = {
  paid:          "bg-emerald-50 text-emerald-700",
  open:          "bg-amber-50 text-amber-700",
  void:          "bg-gray-100 text-gray-500",
  uncollectible: "bg-red-50 text-red-600",
};

export default function InvoiceHistoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["billing-invoices"],
    queryFn:  getBillingInvoices,
  });

  const portalMutation = useMutation({
    mutationFn: getBillingPortal,
    onSuccess: (data) => { window.location.href = data.url; },
  });

  const invoices: BillingInvoice[] = data?.invoices ?? [];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoice History</h1>
          <p className="mt-1 text-sm text-gray-500">Past billing invoices for your organization</p>
        </div>
        <button
          onClick={() => portalMutation.mutate()}
          disabled={portalMutation.isPending}
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
        >
          {portalMutation.isPending ? "Opening…" : "Manage Subscription"}
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm text-gray-500">No invoices yet.</p>
            <p className="mt-1 text-xs text-gray-400">Invoices appear here after your first billing cycle.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Invoice", "Date", "Amount", "Status", ""].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map((inv, i) => (
                  <motion.tr
                    key={inv.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-5 py-3 font-mono text-xs text-gray-500">
                      {inv.number ?? inv.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                      {fmtDate(inv.created)}
                    </td>
                    <td className="px-5 py-3 font-semibold tabular-nums text-gray-800">
                      {fmtAmount(inv.amount_paid || inv.amount_due, inv.currency)}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${STATUS_STYLES[inv.status] ?? "bg-gray-100 text-gray-500"}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-3">
                        {inv.hosted_invoice_url && (
                          <a href={inv.hosted_invoice_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap">
                            View
                          </a>
                        )}
                        {inv.invoice_pdf && (
                          <a href={inv.invoice_pdf} target="_blank" rel="noopener noreferrer"
                            className="text-xs font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap">
                            PDF
                          </a>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
