"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWhatsAppConfig,
  updateWhatsAppConfig,
  verifyWhatsAppConnection,
  sendWhatsAppTestMessage,
} from "@/lib/api";
import type { OrgWhatsAppConfig } from "@/types";

const MASK = "••••••••";
const SECRET_FIELDS = ["access_token", "app_secret", "verify_token"] as const;

function SecretField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const isSet = value === MASK;
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {editing || !isSet ? (
        <input
          type="password"
          value={isSet ? "" : value}
          placeholder={isSet ? "Enter new value to replace" : ""}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => { if (!value) setEditing(false); }}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
          autoFocus={editing}
        />
      ) : (
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-gray-400 tracking-widest">{MASK}</span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs text-blue-600 hover:underline"
          >
            Change
          </button>
        </div>
      )}
    </div>
  );
}

const SETUP_STEPS = [
  "Go to Meta Business Suite (business.facebook.com) → Create a Business Account.",
  "Navigate to Meta for Developers → Create New App → Choose \"Business\".",
  "Add the WhatsApp product to your app.",
  "Under WhatsApp → API Setup: add a phone number and copy your Phone Number ID.",
  "Generate a System User token with whatsapp_business_messaging permission → this is your Access Token.",
  "Copy your App ID and App Secret from App Settings → Basic.",
  "Create any string as your Verify Token — paste it here AND in Meta App → Webhooks → Verify Token.",
  "Set your webhook URL to: https://your-domain.com/api/v1/whatsapp/webhook/",
  "Click Verify & Save in Meta, then click Test Connection here.",
];

export function WhatsAppIntegrationCard() {
  const qc = useQueryClient();
  const [guideOpen, setGuideOpen] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);
  const [testMsg, setTestMsg] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<OrgWhatsAppConfig>>({});
  const [dirty, setDirty] = useState(false);

  const { data: config, isLoading } = useQuery<OrgWhatsAppConfig>({
    queryKey: ["wa-config"],
    queryFn: getWhatsAppConfig,
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      // Don't send empty strings for secret fields — that would clear stored credentials.
      const payload = { ...form };
      for (const f of SECRET_FIELDS) {
        if ((payload as Record<string, unknown>)[f] === "") {
          delete (payload as Record<string, unknown>)[f];
        }
      }
      return updateWhatsAppConfig(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wa-config"] });
      setForm({});
      setDirty(false);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: verifyWhatsAppConnection,
    onSuccess: (r) => setVerifyMsg(r.detail),
    onError: () => setVerifyMsg("Verification failed. Check credentials."),
  });

  const testMutation = useMutation({
    mutationFn: sendWhatsAppTestMessage,
    onSuccess: () => setTestMsg("Test message sent!"),
    onError: () => setTestMsg("Failed to send test message."),
  });

  const merged = { ...config, ...form } as OrgWhatsAppConfig;

  function patch(key: keyof OrgWhatsAppConfig, value: unknown) {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  }

  function statusBadge() {
    if (!config) return null;
    if (config.is_active && config.webhook_verified_at) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
          ● Connected
        </span>
      );
    }
    if (config.phone_number_id) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
          ● Pending Verification
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
        ○ Not Connected
      </span>
    );
  }

  if (isLoading) {
    return <div className="p-6 text-sm text-gray-400">Loading WhatsApp config…</div>;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">WhatsApp Integration</h2>
          {config?.display_phone && (
            <p className="text-sm text-gray-500">{config.display_phone}</p>
          )}
        </div>
        {statusBadge()}
      </div>

      {/* Credentials form */}
      <div className="space-y-3 border-t pt-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Display Phone Number</label>
          <input
            value={merged.display_phone ?? ""}
            onChange={(e) => patch("display_phone", e.target.value)}
            placeholder="+923001234567"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number ID</label>
          <input
            value={merged.phone_number_id ?? ""}
            onChange={(e) => patch("phone_number_id", e.target.value)}
            placeholder="123456789012345"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">App ID</label>
          <input
            value={merged.app_id ?? ""}
            onChange={(e) => patch("app_id", e.target.value)}
            placeholder="987654321"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
          />
        </div>

        {SECRET_FIELDS.map((field) => (
          <SecretField
            key={field}
            label={
              field === "access_token"
                ? "Access Token"
                : field === "app_secret"
                ? "App Secret"
                : "Verify Token"
            }
            value={merged[field] ?? ""}
            onChange={(v) => patch(field, v)}
          />
        ))}

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={merged.is_active ?? false}
            onChange={(e) => patch("is_active", e.target.checked)}
            className="h-4 w-4 text-blue-600 rounded"
          />
          <span className="text-sm text-gray-700">Active</span>
        </label>

        <button
          disabled={!dirty || saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40"
        >
          {saveMutation.isPending ? "Saving…" : "Save Credentials"}
        </button>
      </div>

      {/* Automation toggles */}
      <div className="border-t pt-4 space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Automation</h3>
        {(["ai_enabled", "auto_reply_enabled"] as const).map((key) => (
          <label key={key} className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-gray-700">
              {key === "ai_enabled" ? "AI Automation" : "Auto-Replies"}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={merged[key] ?? true}
              onClick={() => {
                const next = !(merged[key] ?? true);
                // Save immediately without accumulating in form state
                // to avoid race with "Save Credentials".
                updateWhatsAppConfig({ [key]: next }).then(() =>
                  qc.invalidateQueries({ queryKey: ["wa-config"] })
                );
              }}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                (merged[key] ?? true) ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                  (merged[key] ?? true) ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
          </label>
        ))}
      </div>

      {/* Action buttons */}
      <div className="border-t pt-4 flex flex-wrap gap-2 items-center">
        <button
          onClick={() => { setVerifyMsg(null); verifyMutation.mutate(); }}
          disabled={verifyMutation.isPending}
          className="px-4 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          {verifyMutation.isPending ? "Verifying…" : "Test Connection"}
        </button>
        <button
          onClick={() => { setTestMsg(null); testMutation.mutate(); }}
          disabled={testMutation.isPending}
          className="px-4 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          {testMutation.isPending ? "Sending…" : "Send Test Message"}
        </button>
        {verifyMsg && <p className="text-sm text-gray-600">{verifyMsg}</p>}
        {testMsg && <p className="text-sm text-gray-600">{testMsg}</p>}
      </div>

      {/* Setup guide accordion */}
      <div className="border-t pt-4">
        <button
          type="button"
          onClick={() => setGuideOpen((o) => !o)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-blue-600 w-full text-left"
        >
          <span>{guideOpen ? "▼" : "▶"}</span>
          How to Connect Your WhatsApp Business Account
        </button>
        {guideOpen && (
          <ol className="mt-3 space-y-2 text-sm text-gray-600 list-decimal list-inside">
            {SETUP_STEPS.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
