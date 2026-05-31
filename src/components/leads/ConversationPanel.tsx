"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Send } from "lucide-react";
import { getLeadConversations, sendLeadMessage } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate } from "@/lib/utils";
import type { Lead, ConversationMessage } from "@/types";

interface Props {
  lead: Lead;
  onClose: () => void;
}

export function ConversationPanel({ lead, onClose }: Props) {
  const qc = useQueryClient();
  const [message, setMessage] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["lead-conversations", lead.id],
    queryFn:  () => getLeadConversations(lead.id).then((r) => r.data),
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

  function handleSend() {
    const trimmed = message.trim();
    if (trimmed) sendMutation.mutate(trimmed);
  }

  return (
    <div
      role="dialog"
      aria-label={`Conversation with ${lead.name || lead.phone}`}
      aria-modal="true"
      className="fixed inset-y-0 end-0 w-full sm:w-96 bg-[var(--bg-surface)] border-s border-[var(--border)] shadow-xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] shrink-0">
        <div>
          <p className="font-semibold text-[var(--text-primary)]">{lead.name || "Unknown"}</p>
          <p className="text-xs text-[var(--text-muted)] font-mono">{lead.phone}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close conversation panel"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-[var(--text-muted)] py-8">No messages yet</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.direction === "outbound"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-[var(--bg-muted)] text-[var(--text-primary)] rounded-bl-sm"
                }`}
              >
                <p className="leading-snug whitespace-pre-wrap">{m.body}</p>
                <p className={`text-xs mt-1 ${m.direction === "outbound" ? "text-blue-200" : "text-[var(--text-muted)]"}`}>
                  {formatDate(m.created_at)}
                  {m.channel === "whatsapp" ? " · WhatsApp" : " · Dashboard"}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Send */}
      <div className="border-t border-[var(--border)] px-4 py-3 shrink-0">
        <div className="flex gap-2">
          <label htmlFor="conv-message" className="sr-only">Message to {lead.name || lead.phone}</label>
          <input
            id="conv-message"
            type="text"
            placeholder="Send a WhatsApp message…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && message.trim()) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-[var(--text-muted)]"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sendMutation.isPending || !message.trim()}
            aria-label="Send message"
            className="rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
          >
            {sendMutation.isPending
              ? <Loader2 size={15} className="animate-spin" aria-hidden="true" />
              : <Send size={15} aria-hidden="true" />}
            <span className="text-sm font-medium hidden sm:inline">Send</span>
          </button>
        </div>
        <AnimatePresence>
          {sendMutation.isError && (
            <motion.p
              role="alert"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-1.5 text-xs text-red-600"
            >
              Failed to send — please try again.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
