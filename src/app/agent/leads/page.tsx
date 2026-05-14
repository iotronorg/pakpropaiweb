"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { getLeads, getLeadConversations, sendLeadMessage } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate, formatPKR } from "@/lib/utils";
import type { Lead, ConversationMessage } from "@/types";

function IntentBar({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  const color = score >= 7 ? "bg-green-500" : score >= 4 ? "bg-yellow-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500">{score}/10</span>
    </div>
  );
}

function ConversationPanel({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const qc = useQueryClient();
  const [message, setMessage] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["lead-conversations", lead.id],
    queryFn: () => getLeadConversations(lead.id).then((r) => r.data),
    refetchInterval: 8000,
  });

  const sendMutation = useMutation({
    mutationFn: (body: string) => sendLeadMessage(lead.id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lead-conversations", lead.id] });
      setMessage("");
    },
  });

  const messages: ConversationMessage[] = data ?? [];

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <p className="font-semibold text-gray-900">{lead.name || "Unknown"}</p>
          <p className="text-xs text-gray-400 font-mono">{lead.phone}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-xl leading-none"
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">No messages yet</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.direction === "outbound"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-800 rounded-bl-sm"
                }`}
              >
                <p className="leading-snug">{m.body}</p>
                <p className={`text-xs mt-1 ${m.direction === "outbound" ? "text-blue-200" : "text-gray-400"}`}>
                  {formatDate(m.created_at)}
                  {m.channel === "whatsapp" ? " · WhatsApp" : " · Dashboard"}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Send */}
      <div className="border-t border-gray-100 px-4 py-3">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Send a WhatsApp message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && message.trim()) {
                e.preventDefault();
                sendMutation.mutate(message.trim());
              }
            }}
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => message.trim() && sendMutation.mutate(message.trim())}
            disabled={sendMutation.isPending || !message.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Send
          </button>
        </div>
        {sendMutation.isError && (
          <p className="mt-1 text-xs text-red-500">Failed to send message</p>
        )}
      </div>
    </div>
  );
}

export default function AgentLeadsPage() {
  const [openLead, setOpenLead] = useState<Lead | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["agent-leads-full"],
    queryFn: () => getLeads().then((r) => r.data).catch(() => ({ results: [] })),
  });

  const leads: Lead[] = data?.results ?? [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Leads</h1>
        <p className="mt-1 text-sm text-gray-500">All leads assigned to you, sorted by intent score</p>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                <th className="px-6 py-3">Contact</th>
                <th className="px-6 py-3">Location Interest</th>
                <th className="px-6 py-3">Budget</th>
                <th className="px-6 py-3">Intent Score</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">CRM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {leads
                .sort((a, b) => (b.intent_score ?? 0) - (a.intent_score ?? 0))
                .map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <p className="font-medium text-gray-900">{l.name || "Unknown"}</p>
                      <p className="text-xs text-gray-400 font-mono">{l.phone}</p>
                    </td>
                    <td className="px-6 py-3 text-gray-600">{l.location_interest || "—"}</td>
                    <td className="px-6 py-3 text-gray-600">
                      {l.budget_max ? formatPKR(l.budget_max) : "—"}
                    </td>
                    <td className="px-6 py-3">
                      {l.intent_score !== null ? (
                        <IntentBar score={l.intent_score} />
                      ) : (
                        <span className="text-gray-300 text-xs">Unscored</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <Badge
                        label={l.status}
                        variant={
                          l.status === "qualified" ? "green"
                            : l.status === "cold" ? "gray"
                            : "yellow"
                        }
                      />
                    </td>
                    <td className="px-6 py-3 text-gray-400">{formatDate(l.created_at)}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/agent/leads/${l.id}`}
                          className="text-xs text-gray-600 hover:underline font-medium"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => setOpenLead(l)}
                          className="text-xs text-blue-600 hover:underline font-medium"
                        >
                          Chat
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No leads yet — they appear here when buyers connect via WhatsApp
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {openLead && (
        <ConversationPanel lead={openLead} onClose={() => setOpenLead(null)} />
      )}
    </div>
  );
}
