"use client";

import { useState } from "react";
import type { MetaTemplate } from "@/types";

interface Props {
  template: MetaTemplate;
  onComponentsChange?: (components: object[]) => void;
}

function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{(\d+)\}\}/g) || [];
  return [...new Set(matches)];
}

export default function TemplatePreviewPanel({ template, onComponentsChange }: Props) {
  const bodyComponent = template.components.find(
    (c: any) => c.type === "BODY"
  ) as { type: string; text: string } | undefined;

  const bodyText  = bodyComponent?.text ?? template.body_preview;
  const variables = extractVariables(bodyText);

  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(variables.map(v => [v, ""]))
  );

  const preview = variables.reduce(
    (text, v) => text.replace(new RegExp(`\\${v}`, "g"), values[v] || v),
    bodyText
  );

  function handleChange(variable: string, value: string) {
    const next = { ...values, [variable]: value };
    setValues(next);
    if (onComponentsChange) {
      const params = variables.map(v => ({ type: "text", text: next[v] || "" }));
      onComponentsChange([{ type: "body", parameters: params }]);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
      {/* WhatsApp bubble mock */}
      <div className="flex justify-start">
        <div className="max-w-xs rounded-2xl rounded-tl-none bg-white px-4 py-2 shadow text-sm text-gray-800 whitespace-pre-wrap">
          {preview}
        </div>
      </div>

      <p className="text-xs text-gray-500">
        <span className="font-medium">{template.name}</span> · {template.language} · {template.category}
      </p>

      {variables.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600">Fill in variables:</p>
          {variables.map(v => (
            <div key={v} className="flex items-center gap-2">
              <span className="text-xs text-amber-600 font-mono w-8">{v}</span>
              <input
                value={values[v]}
                onChange={e => handleChange(v, e.target.value)}
                placeholder={`Value for ${v}`}
                className="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-xs
                           focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
