"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  getCampaigns, createCampaignFull, updateCampaign,
  sendCampaign, cancelCampaign, deleteCampaign, scheduleCampaign,
  getCampaignTemplates, getCampaignProgress,
} from "@/lib/api";
import type { Campaign, CampaignAudienceFilter, MetaTemplate } from "@/types";
import TemplatePreviewPanel from "@/components/campaigns/TemplatePreviewPanel";

// ── helpers ──────────────────────────────────────────────────────────────────

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

// ── form state ───────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  audience: CampaignAudienceFilter;
  mode: "text" | "template";
  message: string;
  templateKey: string;      // "name::language" or ""
  components: object[];
  tier: 1 | 2 | 3;
  budgetMin: string;
  budgetMax: string;
  areaInterest: string;
}

function defaultForm(c?: Campaign): FormState {
  return {
    name:         c?.name ?? "",
    audience:     c?.audience_filter ?? "all",
    mode:         c?.meta_template_name ? "template" : "text",
    message:      c?.message_template ?? "",
    templateKey:  c?.meta_template_name
                    ? `${c.meta_template_name}::${c.meta_template_language}`
                    : "",
    components:   c?.meta_template_components ?? [],
    tier:         c?.messaging_tier ?? 1,
    budgetMin:    c?.budget_min?.toString() ?? "",
    budgetMax:    c?.budget_max?.toString() ?? "",
    areaInterest: c?.area_interest ?? "",
  };
}

function buildPayload(form: FormState) {
  const [tName = "", tLang = ""] = form.templateKey ? form.templateKey.split("::") : [];
  return {
    name:                     form.name,
    audience_filter:          form.audience,
    message_template:         form.mode === "text" ? form.message : "",
    meta_template_name:       form.mode === "template" ? tName : null,
    meta_template_language:   form.mode === "template" ? tLang : "",
    meta_template_components: form.mode === "template" ? form.components : [],
    messaging_tier:           form.tier,
    budget_min:               form.budgetMin ? Number(form.budgetMin) : null,
    budget_max:               form.budgetMax ? Number(form.budgetMax) : null,
    area_interest:            form.areaInterest || null,
  };
}

// ── CampaignFormBody ─────────────────────────────────────────────────────────

const INPUT = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400";

function CampaignFormBody({ form, setForm }: { form: FormState; setForm: (f: FormState) => void }) {
  const { data: templates = [], isLoading: tplLoading } = useQuery({
    queryKey: ["campaign-templates"],
    queryFn: getCampaignTemplates,
    staleTime: 10 * 60_000,
  });

  const selectedTpl: MetaTemplate | undefined = form.templateKey
    ? templates.find(t => `${t.name}::${t.language}` === form.templateKey)
    : undefined;

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Campaign name</label>
        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. DHA Lahore — May Promotion" className={INPUT} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Audience</label>
        <select value={form.audience}
          onChange={e => setForm({ ...form, audience: e.target.value as CampaignAudienceFilter })}
          className={INPUT}>
          {Object.entries(AUDIENCE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1 w-fit gap-1">
        {(["text", "template"] as const).map(m => (
          <button key={m} type="button" onClick={() => setForm({ ...form, mode: m })}
            className={`rounded-md px-3 py-1 text-xs font-semibold cursor-pointer transition-colors ${
              form.mode === m ? "bg-white text-amber-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {m === "text" ? "Custom Text" : "Meta Template"}
          </button>
        ))}
      </div>

      {form.mode === "text" ? (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Message <span className="text-gray-400 font-normal">({form.message.length}/4096)</span>
          </label>
          <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
            rows={5} maxLength={4096} placeholder="Write your WhatsApp message here…"
            className={`${INPUT} resize-none`} />
        </div>
      ) : (
        <div className="space-y-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">Template</label>
          <select value={form.templateKey}
            onChange={e => setForm({ ...form, templateKey: e.target.value, components: [] })}
            className={INPUT} disabled={tplLoading}>
            <option value="">{tplLoading ? "Loading templates…" : "— Select a template —"}</option>
            {templates.map(t => (
              <option key={`${t.name}::${t.language}`} value={`${t.name}::${t.language}`}>
                {t.name} ({t.language}) · {t.category}
              </option>
            ))}
          </select>
          {selectedTpl && (
            <TemplatePreviewPanel template={selectedTpl}
              onComponentsChange={comps => setForm({ ...form, components: comps })} />
          )}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Messaging Tier</label>
        <select value={form.tier}
          onChange={e => setForm({ ...form, tier: Number(e.target.value) as 1 | 2 | 3 })}
          className={INPUT}>
          <option value={1}>Tier 1 — 1,000 / day</option>
          <option value={2}>Tier 2 — 10,000 / day</option>
          <option value={3}>Tier 3 — 100,000 / day</option>
        </select>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-gray-700">Budget min</label>
          <input type="number" min={0} value={form.budgetMin}
            onChange={e => setForm({ ...form, budgetMin: e.target.value })}
            placeholder="0" className={INPUT} />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-gray-700">Budget max</label>
          <input type="number" value={form.budgetMax}
            onChange={e => setForm({ ...form, budgetMax: e.target.value })}
            placeholder="Any" className={INPUT} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Area interest filter</label>
        <input value={form.areaInterest}
          onChange={e => setForm({ ...form, areaInterest: e.target.value })}
          placeholder="e.g. DHA, Gulberg (optional)" className={INPUT} />
      </div>
    </div>
  );
}

// ── Create Modal ──────────────────────────────────────────────────────────────

function CreateModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(defaultForm());
  const [error, setError] = useState("");
  const isValid = form.name.trim() && (form.mode === "text" ? !!form.message.trim() : !!form.templateKey);

  const create = useMutation({
    mutationFn: () => createCampaignFull(buildPayload(form)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["campaigns"] }); onClose(); },
    onError: (e: unknown) => setError(
      (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to create campaign."
    ),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="mb-5 text-lg font-semibold text-gray-900">New Campaign</h2>
        <CampaignFormBody form={form} setForm={setForm} />
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 cursor-pointer">
            Cancel
          </button>
          <button onClick={() => create.mutate()} disabled={!isValid || create.isPending}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50 cursor-pointer">
            {create.isPending ? "Creating…" : "Create Campaign"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditModal({ campaign, onClose }: { campaign: Campaign; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(defaultForm(campaign));
  const [error, setError] = useState("");
  const isValid = form.name.trim() && (form.mode === "text" ? !!form.message.trim() : !!form.templateKey);

  const edit = useMutation({
    mutationFn: () => updateCampaign(campaign.id, buildPayload(form)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["campaigns"] }); onClose(); },
    onError: (e: unknown) => setError(
      (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to update campaign."
    ),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="mb-5 text-lg font-semibold text-gray-900">Edit Campaign</h2>
        <CampaignFormBody form={form} setForm={setForm} />
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 cursor-pointer">
            Cancel
          </button>
          <button onClick={() => edit.mutate()} disabled={!isValid || edit.isPending}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50 cursor-pointer">
            {edit.isPending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Schedule Modal ────────────────────────────────────────────────────────────

function ScheduleModal({ campaign, onClose }: { campaign: Campaign; onClose: () => void }) {
  const qc = useQueryClient();
  const [scheduledAt, setScheduledAt] = useState("");
  const [error, setError] = useState("");

  const schedule = useMutation({
    mutationFn: () => scheduleCampaign(campaign.id, scheduledAt),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["campaigns"] }); onClose(); },
    onError: (e: unknown) => setError(
      (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to schedule campaign."
    ),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-2 text-lg font-semibold text-gray-900">Schedule Campaign</h2>
        <p className="mb-4 text-sm text-gray-500">{campaign.name}</p>
        <label className="mb-1 block text-sm font-medium text-gray-700">Send at</label>
        <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
          className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-3">
          <button onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 cursor-pointer">
            Cancel
          </button>
          <button onClick={() => schedule.mutate()} disabled={!scheduledAt || schedule.isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
            {schedule.isPending ? "Scheduling…" : "Schedule"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────

function CampaignProgressBar({ campaignId }: { campaignId: string }) {
  const { data } = useQuery({
    queryKey: ["campaign-progress", campaignId],
    queryFn: () => getCampaignProgress(campaignId),
    refetchInterval: 3000,
  });
  if (!data) return null;
  const pct = Math.min(100, data.pct_complete);
  return (
    <div className="mt-3">
      <div className="mb-1 flex justify-between text-[11px] text-gray-500">
        <span>{data.sent.toLocaleString()} sent</span>
        <span>
          {data.pending.toLocaleString()} pending
          {data.failed > 0 && ` · ${data.failed.toLocaleString()} failed`}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100">
        <div className="h-1.5 rounded-full bg-amber-400 transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Campaign Card ─────────────────────────────────────────────────────────────

function CampaignCard({ campaign, onEdit, onSchedule }: {
  campaign: Campaign;
  onEdit: (c: Campaign) => void;
  onSchedule: (c: Campaign) => void;
}) {
  const qc = useQueryClient();

  const sendMut   = useMutation({ mutationFn: () => sendCampaign(campaign.id),   onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }) });
  const cancelMut = useMutation({ mutationFn: () => cancelCampaign(campaign.id), onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }) });
  const deleteMut = useMutation({ mutationFn: () => deleteCampaign(campaign.id), onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }) });

  const canSend     = campaign.status === "draft" || campaign.status === "scheduled";
  const canCancel   = campaign.status === "scheduled";
  const canDelete   = campaign.status === "draft" || campaign.status === "cancelled";
  const canEdit     = campaign.status === "draft";
  const canSchedule = campaign.status === "draft";

  const msgPreview = campaign.meta_template_name
    ? `Template: ${campaign.meta_template_name} (${campaign.meta_template_language})`
    : campaign.message_template;

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
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
            <p className="mt-1 text-xs text-blue-600">Scheduled for {fmtDate(campaign.scheduled_at)}</p>
          )}
          {campaign.sent_at && (
            <p className="mt-1 text-xs text-emerald-600">
              Sent {fmtDate(campaign.sent_at)} · {campaign.sent_count.toLocaleString()} delivered
              {campaign.failed_count > 0 && `, ${campaign.failed_count} failed`}
            </p>
          )}
        </div>

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

      <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 line-clamp-2 whitespace-pre-wrap">
        {msgPreview}
      </p>

      {campaign.status === "sending" && <CampaignProgressBar campaignId={campaign.id} />}

      <div className="mt-4 flex gap-2 flex-wrap">
        {canSend && (
          <button onClick={() => sendMut.mutate()} disabled={sendMut.isPending}
            className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50 cursor-pointer">
            {sendMut.isPending ? "Sending…" : "Send Now"}
          </button>
        )}
        {canSchedule && (
          <button onClick={() => onSchedule(campaign)}
            className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 cursor-pointer">
            Schedule
          </button>
        )}
        {canEdit && (
          <button onClick={() => onEdit(campaign)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer">
            Edit
          </button>
        )}
        {canCancel && (
          <button onClick={() => cancelMut.mutate()} disabled={cancelMut.isPending}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 cursor-pointer">
            Cancel
          </button>
        )}
        {canDelete && (
          <button onClick={() => { if (confirm("Delete this campaign?")) deleteMut.mutate(); }}
            disabled={deleteMut.isPending}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-50 cursor-pointer ml-auto">
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
  const [tab,           setTab]           = useState("all");
  const [showCreate,    setShowCreate]    = useState(false);
  const [editCampaign,  setEditCampaign]  = useState<Campaign | null>(null);
  const [schedCampaign, setSchedCampaign] = useState<Campaign | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["campaigns", tab],
    queryFn: () => getCampaigns(tab !== "all" ? { status: tab } : {}).then(r => r.data),
  });

  const campaigns: Campaign[] = data?.results ?? [];
  const total: number         = data?.count   ?? 0;

  return (
    <>
      <AnimatePresence>
        {showCreate    && <CreateModal   onClose={() => setShowCreate(false)} />}
        {editCampaign  && <EditModal     campaign={editCampaign}  onClose={() => setEditCampaign(null)} />}
        {schedCampaign && <ScheduleModal campaign={schedCampaign} onClose={() => setSchedCampaign(null)} />}
      </AnimatePresence>

      <div className="space-y-6 pb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
            <p className="mt-1 text-sm text-gray-500">Send bulk WhatsApp messages to filtered lead segments</p>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreate(true)}
            className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 shadow-sm cursor-pointer">
            + New Campaign
          </motion.button>
        </div>

        <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 w-fit">
          {STATUS_TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors cursor-pointer ${
                tab === t ? "bg-white text-amber-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {t}
            </button>
          ))}
        </div>

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
            {campaigns.map(c => (
              <CampaignCard key={c.id} campaign={c} onEdit={setEditCampaign} onSchedule={setSchedCampaign} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
