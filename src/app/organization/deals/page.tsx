"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { getDealLocks, confirmDealLock, cancelDealLock, releaseDealLock, disputeDealLock, sellerConfirmDealLock } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { DealLock, DealLockStatus } from "@/types";
import { formatCurrency } from "@/lib/utils";

const STATUS_TABS = ["all", "initiated", "locked", "released", "cancelled", "disputed", "expired"] as const;

const STATUS_VARIANT: Record<DealLockStatus, "yellow" | "green" | "gray" | "red" | "blue" | "purple" | "teal"> = {
  initiated: "yellow",
  locked:    "blue",
  released:  "green",
  cancelled: "gray",
  disputed:  "red",
  expired:   "gray",
};

export default function OrgDealsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<string>("all");
  const [confirmDeal,  setConfirmDeal]  = useState<DealLock | null>(null);
  const [paymentRef,   setPaymentRef]   = useState("");
  const [disputeDeal,  setDisputeDeal]  = useState<DealLock | null>(null);
  const [disputeNotes, setDisputeNotes] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["org-deals", tab],
    queryFn: () =>
      getDealLocks(tab !== "all" ? { status: tab } : {}).then((r) => r.data),
  });

  const deals: DealLock[] = (data as { results?: DealLock[] })?.results ?? (data as DealLock[]) ?? [];

  const confirmMutation = useMutation({
    mutationFn: ({ id, ref }: { id: string; ref: string }) =>
      confirmDealLock(id, { payment_ref: ref }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-deals"] });
      setConfirmDeal(null);
      setPaymentRef("");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelDealLock(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["org-deals"] }),
  });

  const releaseMutation = useMutation({
    mutationFn: (id: string) => releaseDealLock(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["org-deals"] }),
  });

  const sellerConfirmMutation = useMutation({
    mutationFn: (id: string) => sellerConfirmDealLock(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["org-deals"] }),
  });

  const disputeMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      disputeDealLock(id, notes || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-deals"] });
      setDisputeDeal(null);
      setDisputeNotes("");
    },
  });

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Deal Locks</h1>
        <p className="mt-1 text-sm text-gray-500">
          Deal lock requests on your organization&apos;s properties
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 w-fit">
        {STATUS_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors capitalize ${
              tab === t
                ? "bg-white text-blue-600 shadow-sm border border-gray-200"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Property", "Buyer", "Amount", "Gateway", "Status", "Created", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {deals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-gray-400">
                      No deal locks found
                    </td>
                  </tr>
                ) : (
                  deals.map((deal) => (
                    <tr key={deal.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900">{deal.property_title}</p>
                        {deal.property_city && (
                          <p className="text-xs text-gray-400">{deal.property_city}</p>
                        )}
                      </td>
                      <td className="px-5 py-3 font-mono text-sm text-gray-600">
                        {deal.buyer_phone}
                      </td>
                      <td className="px-5 py-3 font-semibold tabular-nums text-gray-800">
                        {formatCurrency(deal.token_amount, deal.currency)}
                      </td>
                      <td className="px-5 py-3 text-xs capitalize text-gray-500">
                        {deal.payment_gateway.replace(/_/g, " ")}
                      </td>
                      <td className="px-5 py-3">
                        <Badge
                          label={deal.status}
                          variant={STATUS_VARIANT[deal.status] ?? "gray"}
                        />
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-xs text-gray-400">
                        {new Date(deal.created_at).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {deal.status === "initiated" && (
                            <button
                              onClick={() => {
                                setConfirmDeal(deal);
                                setPaymentRef("");
                              }}
                              className="whitespace-nowrap rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100"
                            >
                              Confirm
                            </button>
                          )}
                          {deal.status === "locked" && (
                            <button
                              onClick={() => releaseMutation.mutate(deal.id)}
                              disabled={releaseMutation.isPending}
                              className="whitespace-nowrap rounded-md bg-green-50 px-2.5 py-1 text-xs font-medium text-green-600 transition-colors hover:bg-green-100 disabled:opacity-50"
                            >
                              Release
                            </button>
                          )}
                          {deal.status === "locked" && (
                            <button
                              onClick={() => sellerConfirmMutation.mutate(deal.id)}
                              disabled={sellerConfirmMutation.isPending}
                              className="whitespace-nowrap rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
                            >
                              Seller Confirm
                            </button>
                          )}
                          {deal.status === "locked" && (
                            <button
                              onClick={() => { setDisputeDeal(deal); setDisputeNotes(""); }}
                              className="whitespace-nowrap rounded-md bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-600 transition-colors hover:bg-orange-100"
                            >
                              Dispute
                            </button>
                          )}
                          {(deal.status === "initiated" || deal.status === "locked") && (
                            <button
                              onClick={() => cancelMutation.mutate(deal.id)}
                              disabled={cancelMutation.isPending}
                              className="whitespace-nowrap rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-100 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          )}
                          {deal.status !== "initiated" && deal.status !== "locked" && (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dispute modal */}
      <AnimatePresence>
        {disputeDeal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setDisputeDeal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            >
              <h2 className="mb-1 text-lg font-semibold text-gray-900">Dispute Deal</h2>
              <p className="mb-4 text-sm text-gray-500">
                Property: <span className="font-medium text-gray-700">{disputeDeal.property_title}</span>
              </p>
              <label className="mb-1 block text-xs font-medium text-gray-600">Notes (optional)</label>
              <textarea
                rows={3}
                placeholder="Describe the reason for this dispute…"
                value={disputeNotes}
                onChange={(e) => setDisputeNotes(e.target.value)}
                className="mb-4 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
              {disputeMutation.isError && (
                <p className="mb-3 text-xs text-red-500">Failed to dispute deal. Please try again.</p>
              )}
              <div className="flex justify-end gap-2">
                <button onClick={() => setDisputeDeal(null)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={() => disputeMutation.mutate({ id: disputeDeal.id, notes: disputeNotes })}
                  disabled={disputeMutation.isPending}
                  className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50">
                  {disputeMutation.isPending ? "Submitting…" : "Submit Dispute"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Payment modal */}
      <AnimatePresence>
        {confirmDeal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setConfirmDeal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            >
              <h2 className="mb-1 text-lg font-semibold text-gray-900">Confirm Payment</h2>
              <p className="mb-4 text-sm text-gray-500">
                Property:{" "}
                <span className="font-medium text-gray-700">{confirmDeal.property_title}</span>
                <br />
                Amount:{" "}
                <span className="font-medium text-gray-700">
                  {formatCurrency(confirmDeal.token_amount, confirmDeal.currency)}
                </span>
              </p>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Payment Reference
              </label>
              <input
                type="text"
                placeholder="e.g. TXN123456 or bank reference"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                className="mb-4 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                autoFocus
              />
              {confirmMutation.isError && (
                <p className="mb-3 text-xs text-red-500">Failed to confirm payment. Please try again.</p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setConfirmDeal(null)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    confirmMutation.mutate({ id: confirmDeal.id, ref: paymentRef })
                  }
                  disabled={!paymentRef.trim() || confirmMutation.isPending}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {confirmMutation.isPending ? "Confirming…" : "Confirm Payment"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
