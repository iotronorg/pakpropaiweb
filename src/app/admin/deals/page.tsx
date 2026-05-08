"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDealLocks, confirmDealLock, cancelDealLock, createCheckout, getPayments } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate, formatPKR } from "@/lib/utils";
import { DealLock, DealLockStatus, Payment } from "@/types";

const STATUS_COLORS: Record<DealLockStatus, string> = {
  initiated: "bg-yellow-100 text-yellow-800",
  locked:    "bg-green-100 text-green-800",
  released:  "bg-indigo-100 text-indigo-800",
  cancelled: "bg-gray-100 text-gray-600",
  disputed:  "bg-red-100 text-red-800",
  expired:   "bg-gray-100 text-gray-500",
};

const GATEWAYS: Record<string, string> = {
  jazzcash:  "JazzCash",
  easypaisa: "EasyPaisa",
  bank:      "Bank Transfer",
  safepay:   "Safepay",
  manual:    "Manual",
};

interface ConfirmModalProps {
  deal: DealLock;
  onClose: () => void;
  onConfirm: (ref: string, notes: string) => void;
  loading: boolean;
}

function ConfirmModal({ deal, onClose, onConfirm, loading }: ConfirmModalProps) {
  const [ref, setRef]     = useState("");
  const [notes, setNotes] = useState("");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h3 className="text-lg font-semibold mb-1">Confirm Payment</h3>
        <p className="text-sm text-gray-500 mb-4">
          {deal.property_title} — PKR {formatPKR(deal.token_amount)}
        </p>

        <label className="block text-sm font-medium mb-1">Payment Reference *</label>
        <input
          className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
          placeholder="JazzCash TID / Bank Ref / Receipt No."
          value={ref}
          onChange={e => setRef(e.target.value)}
        />

        <label className="block text-sm font-medium mb-1">Admin Notes (optional)</label>
        <textarea
          className="w-full border rounded-lg px-3 py-2 text-sm mb-4 resize-none"
          rows={2}
          placeholder="Any notes for internal record..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(ref, notes)}
            disabled={!ref.trim() || loading}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Confirming..." : "Confirm & Activate Lock"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDealsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [confirmDeal, setConfirmDeal]   = useState<DealLock | null>(null);
  const [cancelId, setCancelId]         = useState<string | null>(null);
  const [activeTab, setActiveTab]       = useState<"locks" | "payments">("locks");
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["deals", statusFilter],
    queryFn:  () => getDealLocks(statusFilter ? { status: statusFilter } : {}),
  });

  const { data: paymentsData } = useQuery({
    queryKey: ["payments"],
    queryFn:  () => getPayments().then(r => r.data),
    enabled:  activeTab === "payments",
  });

  const confirmMutation = useMutation({
    mutationFn: ({ id, ref, notes }: { id: string; ref: string; notes: string }) =>
      confirmDealLock(id, { payment_ref: ref, admin_notes: notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      setConfirmDeal(null);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelDealLock(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      setCancelId(null);
    },
  });

  async function handlePayOnline(dealId: string) {
    setCheckoutLoading(dealId);
    try {
      const res = await createCheckout(dealId, "safepay");
      const url = res.data?.checkout_url;
      if (url) window.open(url, "_blank");
    } catch {
      alert("Could not create checkout. Check Safepay credentials in settings.");
    } finally {
      setCheckoutLoading(null);
    }
  }

  const deals: DealLock[] = data?.data ?? [];
  const payments: Payment[] = paymentsData?.results ?? [];

  const tabs = [
    { label: "All",       value: "" },
    { label: "Pending",   value: "initiated" },
    { label: "Active",    value: "locked" },
    { label: "Expired",   value: "expired" },
    { label: "Cancelled", value: "cancelled" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Deals & Payments</h1>
          <p className="text-sm text-gray-500 mt-1">Manage deal locks and payment records</p>
        </div>
      </div>

      {/* Top-level tab: Locks / Payments */}
      <div className="flex gap-4 border-b">
        {(["locks", "payments"] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors capitalize ${
              activeTab === t
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            {t === "locks" ? "🔒 Deal Locks" : "💳 Payments"}
          </button>
        ))}
      </div>

      {activeTab === "payments" && (
        <div>
          {payments.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No payment records yet.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border bg-white">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    {["Buyer", "Amount", "Gateway", "Status", "Reference", "Deal", "Date"].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs">{p.user}</td>
                      <td className="px-4 py-3 font-semibold">PKR {formatPKR(p.amount_pkr)}</td>
                      <td className="px-4 py-3 capitalize">{p.gateway}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          p.status === "completed" ? "bg-green-100 text-green-700"
                          : p.status === "failed"  ? "bg-red-100 text-red-700"
                          : p.status === "refunded" ? "bg-purple-100 text-purple-700"
                          : "bg-yellow-100 text-yellow-700"
                        }`}>{p.status}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{p.reference || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs">{p.deal_id ? p.deal_id.slice(0, 8).toUpperCase() : "—"}</td>
                      <td className="px-4 py-3 text-gray-400">{formatDate(p.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "locks" && <>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b">
        {tabs.map(t => (
          <button
            key={t.value}
            onClick={() => setStatusFilter(t.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              statusFilter === t.value
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : deals.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🔒</p>
          <p className="font-medium">No deal locks found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deals.map(deal => (
            <div key={deal.id} className="bg-white rounded-xl border p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Property info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[deal.status]}`}>
                    {deal.status.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-400">{deal.initiated_via}</span>
                </div>
                <p className="font-semibold text-gray-900 truncate">{deal.property_title}</p>
                <p className="text-sm text-gray-500">{deal.property_city}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Buyer: <span className="font-mono">{deal.buyer_phone}</span>
                  {deal.agent_name && <> · Agent: {deal.agent_name}</>}
                </p>
              </div>

              {/* Amount + gateway */}
              <div className="text-right sm:text-left sm:min-w-[140px]">
                <p className="text-lg font-bold text-gray-900">PKR {formatPKR(deal.token_amount)}</p>
                <p className="text-xs text-gray-500">{GATEWAYS[deal.payment_gateway] ?? deal.payment_gateway}</p>
                {deal.payment_ref && (
                  <p className="text-xs text-gray-400 font-mono mt-0.5">Ref: {deal.payment_ref}</p>
                )}
              </div>

              {/* Timer */}
              <div className="text-right sm:min-w-[120px]">
                {deal.status === "locked" && deal.hours_remaining !== null ? (
                  <div>
                    <p className={`text-sm font-bold ${deal.hours_remaining < 6 ? "text-red-600" : "text-green-600"}`}>
                      {deal.hours_remaining.toFixed(1)}h left
                    </p>
                    <p className="text-xs text-gray-400">Expires {formatDate(deal.lock_expires_at!)}</p>
                  </div>
                ) : deal.status === "initiated" ? (
                  <p className="text-xs text-yellow-600 font-medium">Awaiting payment</p>
                ) : (
                  <p className="text-xs text-gray-400">{formatDate(deal.created_at)}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-shrink-0 flex-wrap">
                {deal.status === "initiated" && (
                  <>
                    <button
                      onClick={() => handlePayOnline(deal.id)}
                      disabled={checkoutLoading === deal.id}
                      className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {checkoutLoading === deal.id ? "..." : "💳 Pay Online"}
                    </button>
                    <button
                      onClick={() => setConfirmDeal(deal)}
                      className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Confirm Manual
                    </button>
                  </>
                )}
                {(deal.status === "initiated" || deal.status === "locked") && (
                  <button
                    onClick={() => setCancelId(deal.id)}
                    disabled={cancelMutation.isPending && cancelId === deal.id}
                    className="px-3 py-1.5 text-xs border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm payment modal */}
      {confirmDeal && (
        <ConfirmModal
          deal={confirmDeal}
          onClose={() => setConfirmDeal(null)}
          loading={confirmMutation.isPending}
          onConfirm={(ref, notes) =>
            confirmMutation.mutate({ id: confirmDeal.id, ref, notes })
          }
        />
      )}

      {/* Cancel confirmation */}
      {cancelId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold mb-2">Cancel Deal Lock?</h3>
            <p className="text-sm text-gray-500 mb-4">This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setCancelId(null)} className="px-4 py-2 text-sm text-gray-600">Keep</button>
              <button
                onClick={() => cancelMutation.mutate(cancelId)}
                disabled={cancelMutation.isPending}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {cancelMutation.isPending ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
      </>}
    </div>
  );
}
