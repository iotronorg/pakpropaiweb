"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotificationPreferences, updateNotificationPreferences } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { UserNotificationPreference } from "@/types";

type BoolKey = keyof Omit<UserNotificationPreference, "updated_at">;

const CHANNEL_FIELDS: { key: BoolKey; label: string }[] = [
  { key: "whatsapp_enabled", label: "WhatsApp" },
  { key: "sms_enabled",      label: "SMS" },
  { key: "email_enabled",    label: "Email" },
];

const EVENT_FIELDS: { key: BoolKey; label: string }[] = [
  { key: "lead_updates",          label: "Lead Updates" },
  { key: "appointment_reminders", label: "Appointment Reminders" },
  { key: "deal_updates",          label: "Deal Updates" },
  { key: "report_ready",          label: "Report Ready" },
  { key: "marketing",             label: "Marketing & Promotions" },
];

export function NotificationPreferencesPanel() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<UserNotificationPreference>({
    queryKey: ["notification-preferences"],
    queryFn: () => getNotificationPreferences().then((r) => r.data),
  });

  const mutation = useMutation({
    mutationFn: (patch: Record<string, boolean>) => updateNotificationPreferences(patch),
    onSuccess: (res) => {
      qc.setQueryData(["notification-preferences"], res.data);
    },
  });

  const toggle = (key: BoolKey) => {
    if (!data) return;
    mutation.mutate({ [key]: !data[key] });
  };

  if (isLoading) return <LoadingSpinner />;
  if (!data) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
      <h3 className="text-base font-semibold text-gray-900">Notification Preferences</h3>

      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Channels</p>
        <div className="space-y-2">
          {CHANNEL_FIELDS.map(({ key, label }) => (
            <Toggle key={key} label={label} checked={data[key] as boolean} onChange={() => toggle(key)} />
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Event Types</p>
        <div className="space-y-2">
          {EVENT_FIELDS.map(({ key, label }) => (
            <Toggle key={key} label={label} checked={data[key] as boolean} onChange={() => toggle(key)} />
          ))}
        </div>
      </div>

      {mutation.isPending && (
        <p className="text-xs text-gray-400">Saving…</p>
      )}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer py-1">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
          checked ? "bg-blue-600" : "bg-gray-200"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4.5" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}
