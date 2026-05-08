"use client";

import { useState } from "react";

interface ConfigField {
  key: string;
  label: string;
  placeholder: string;
  type?: string;
  help?: string;
}

const WHATSAPP_FIELDS: ConfigField[] = [
  { key: "WA_ACCESS_TOKEN", label: "Access Token", placeholder: "EAAxxxx…", type: "password", help: "From Meta for Developers → WhatsApp → API Setup" },
  { key: "WA_PHONE_NUMBER_ID", label: "Phone Number ID", placeholder: "123456789", help: "Shown under WhatsApp → API Setup in Meta Dev Portal" },
  { key: "WA_VERIFY_TOKEN", label: "Verify Token", placeholder: "my-secret-token", help: "Any string you choose — used when registering the webhook" },
  { key: "WA_APP_SECRET", label: "App Secret", placeholder: "abcdef123…", type: "password", help: "From App Settings → Basic → App Secret" },
  { key: "WA_OTP_TEMPLATE_NAME", label: "OTP Template Name", placeholder: "otp_template", help: "Template created in Meta Business Manager (approved status required)" },
];

const AI_FIELDS: ConfigField[] = [
  { key: "GEMINI_API_KEY", label: "Gemini API Key", placeholder: "AIzaSy…", type: "password", help: "Google AI Studio → Get API Key" },
  { key: "GEMINI_MODEL", label: "Gemini Model", placeholder: "gemini-2.5-flash-lite", help: "Default: gemini-2.5-flash-lite (free tier)" },
  { key: "AI_BACKEND", label: "AI Backend", placeholder: "gemini", help: "'gemini' for cloud or 'local' for Ollama" },
  { key: "LOCAL_MODEL", label: "Local Model (Ollama)", placeholder: "qwen2.5:7b", help: "Only used when AI_BACKEND=local" },
];

const DB_FIELDS: ConfigField[] = [
  { key: "DATABASE_URL", label: "Database URL", placeholder: "postgresql://user:pass@host/db", help: "Supabase / Neon connection string" },
  { key: "REDIS_URL", label: "Redis URL", placeholder: "redis://…", help: "Upstash Redis URL" },
  { key: "BASE_URL", label: "Base URL", placeholder: "https://yourapp.onrender.com", help: "Public URL of the backend — used for WhatsApp PDF links" },
];

function ConfigSection({ title, description, fields }: { title: string; description: string; fields: ConfigField[] }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  function handleSave() {
    // In production this would POST to a backend settings API
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-6 py-5">
        <h2 className="font-semibold text-gray-900">{title}</h2>
        <p className="mt-0.5 text-sm text-gray-500">{description}</p>
      </div>
      <div className="divide-y divide-gray-50">
        {fields.map((f) => (
          <div key={f.key} className="px-6 py-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
            <input
              type={f.type ?? "text"}
              value={values[f.key] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            {f.help && <p className="mt-1 text-xs text-gray-400">{f.help}</p>}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
        {saved && <span className="text-sm text-green-600 font-medium">Saved ✓</span>}
        <button
          onClick={handleSave}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}

export default function SetupPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">System Setup</h1>
        <p className="mt-1 text-sm text-gray-500">Configure environment variables and integrations for the first run</p>
      </div>

      <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 px-5 py-4">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> These values map directly to backend <code className="rounded bg-yellow-100 px-1">.env</code> variables.
          Update them in your deployment environment (Render, Railway, etc.) or in the <code>.env</code> file locally.
        </p>
      </div>

      <div className="space-y-6">
        <ConfigSection
          title="WhatsApp Cloud API"
          description="Meta WhatsApp Business API credentials — required for the WhatsApp bot to function"
          fields={WHATSAPP_FIELDS}
        />
        <ConfigSection
          title="AI Backend"
          description="Gemini (cloud) or Ollama (local) — controls which model powers the assistant"
          fields={AI_FIELDS}
        />
        <ConfigSection
          title="Database & Infrastructure"
          description="PostgreSQL, Redis, and application base URL"
          fields={DB_FIELDS}
        />
      </div>
    </div>
  );
}
