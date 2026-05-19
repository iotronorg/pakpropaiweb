"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  getCampaigns, createCampaign, sendCampaign, cancelCampaign, deleteCampaign,
} from "@/lib/api";
import type { Campaign, CampaignAudienceFilter } from "@/types";

// ── helpers ───────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  draft:     "bg-gray-100 text-gray-600",
  scheduled: "bg-blue-100 text-blue-700",
  sending:   "bg-amber-100 text-amber-700",
  sent:      "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-500",
  failed:    "bg-red-100 text-red-700",
};

const AUDIENCE_LABELS: Record<CampaignAudienceFilter, string> = {
  all:       "All Leads",
  new:       "New Leads",
  warm:      "Warm Leads",
  qualified: "Qualified Leads",
  cold:      "Cold Leads",
  buy:       "Buy Intent",
  sell:      "Sell Intent",
  rent:      "Rent Intent",
  invest:    "Investment Intent",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PK", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Create Modal ──────────────────────────────────────────────────────────────

function CreateModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [name,     setName]     = useState("");
  const [message,  setMessage]  = useState("");
  const [audience, setAudience] = useState<CampaignAudienceFilter>("all");
  const [error,    setError]    = useState("");

  const create = useMutation({
    mutationFn: () => createCampaign({ name, message_template: message, audience_filter: audience }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      onClose();
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg ?? "Failed to create campaign.");
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 className="mb-5 text-lg font-semibold text-gray-900">New Campaign</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Campaign name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. DHA Lahore — May Promotion"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Audience</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as CampaignAudienceFilter)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {Object.entries(AUDIENCE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Message <span className="text-gray-400 font-normal">({message.length}/4096)</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              maxLength={4096}
              placeholder="Write your WhatsApp message here..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => create.mutate()}
            disabled={!name.trim() || !message.trim() || create.isPending}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50 cursor-pointer"
          >
            {create.isPending ? "Creating…" : "Create Campaign"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Campaign Card ─────────────────────────────────────────────────────────────

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const qc = useQueryClient();

  const sendMut = useMutation({
    mutationFn: () => sendCampaign(campaign.id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });
  const cancelMut = useMutation({
    mutationFn: () => cancelCampaign(campaign.id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });
  const deleteMut = useMutation({
    mutationFn: () => deleteCampaign(campaign.id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });

  const canSend   = campaign.status === "draft" || campaign.status === "scheduled";
  const canCancel = campaign.status === "scheduled";
  const canDelete = campaign.status === "draft" || campaign.status === "cancelled";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 truncate">{campaign.name}</h3>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_COLORS[campaign.status]}`}>
              {campaign.status.toUpperCase()}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-gray-500">
            {AUDIENCE_LABELS[campaign.audience_filter]} · Created {fmtDate(campaign.created_at)}
            {campaign.created_by_name && ` · by ${campaign.created_by_name}`}
          </p>
          {campaign.scheduled_at && campaign.status === "scheduled" && (
            <p className="mt-1 text-xs text-blue-600">
              Scheduled for {fmtDate(campaign.scheduled_at)}
            </p>
          )}
          {campaign.sent_at && (
            <p className="mt-1 text-xs text-emerald-600">
              Sent {fmtDate(campaign.sent_at)} · {campaign.sent_count.toLocaleString()} delivered
              {campaign.failed_count > 0 && `, ${campaign.failed_count} failed`}
            </p>
          )}
        </div>

        {/* Stats */}
        {(campaign.status === "sent" || campaign.status === "sending") && (
          <div className="flex gap-3 shrink-0 text-center">
            <div>
              <p className="text-lg font-bold text-gray-900">{campaign.recipient_count.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Targeted</p>
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-600">{campaign.sent_count.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Sent</p>
            </div>
            {campaign.failed_count > 0 && (
              <div>
                <p className="text-lg font-bold text-red-500">{campaign.failed_count.toLocaleString()}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Failed</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Message preview */}
      <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 line-clamp-2 whitespace-pre-wrap">
        {campaign.message_template}
      </p>

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        {canSend && (
          <button
            onClick={() => sendMut.mutate()}
            disabled={sendMut.isPending}
            className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50 cursor-pointer"
          >
            {sendMut.isPending ? "Sending…" : "Send Now"}
          </button>
        )}
        {canCancel && (
          <button
            onClick={() => cancelMut.mutate()}
            disabled={cancelMut.isPending}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
        )}
        {canDelete && (
          <button
            onClick={() => {
              if (confirm("Delete this campaign?")) deleteMut.mutate();
            }}
            disabled={deleteMut.isPending}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-50 cursor-pointer ml-auto"
          >
            Delete
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const STATUS_TABS = ["all", "draft", "scheduled", "sending", "sent", "cancelled"] as const;

export default function CampaignsPage() {
  const [tab,        setTab]        = useState("all");
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["campaigns", tab],
    queryFn: () =>
      getCampaigns(tab !== "all" ? { status: tab } : {}).then((r) => r.data),
  });

  const campaigns: Campaign[] = data?.results ?? [];
  const total: number         = data?.count   ?? 0;

  return (
    <>
      <AnimatePresence>
        {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}
      </AnimatePresence>

      <div className="space-y-6 pb-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
            <p className="mt-1 text-sm text-gray-500">
              Send bulk WhatsApp messages to filtered lead segments
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreate(true)}
            className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 shadow-sm cursor-pointer"
          >
            + New Campaign
          </motion.button>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 w-fit">
          {STATUS_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors cursor-pointer ${
                tab === t
                  ? "bg-white text-amber-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
            <div className="mb-3 rounded-full bg-amber-50 p-4">
              <svg className="h-8 w-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-600">No campaigns yet</p>
            <p className="mt-1 text-xs text-gray-400">Create your first campaign to send bulk messages</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-gray-400">{total} campaign{total !== 1 ? "s" : ""}</p>
            {campaigns.map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
