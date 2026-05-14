"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotifications, markNotificationsRead } from "@/lib/api";
import type { Notification } from "@/types";

const CHANNEL_LABEL: Record<string, string> = {
  whatsapp: "WhatsApp",
  sms: "SMS",
  email: "Email",
};

const STATUS_COLOR: Record<string, string> = {
  delivered: "text-green-600 bg-green-50",
  sent:      "text-blue-600 bg-blue-50",
  failed:    "text-red-600 bg-red-50",
  pending:   "text-yellow-600 bg-yellow-50",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationsInbox() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const { data, isLoading } = useQuery({
    queryKey: ["notifications-inbox", page],
    queryFn: () =>
      getNotifications({ limit: pageSize, offset: (page - 1) * pageSize }).then(
        (r) => r.data
      ),
    refetchInterval: 30000,
  });

  const markMutation = useMutation({
    mutationFn: (ids?: string[]) => markNotificationsRead(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications-inbox"] }),
  });

  const notifications: Notification[] = data?.results ?? [];
  const total: number = data?.count ?? 0;
  const unread: number = data?.unread_count ?? 0;
  const totalPages = Math.ceil(total / pageSize);
  const hasUnread = notifications.some((n) => !n.is_read);

  function markOne(id: string) {
    markMutation.mutate([id]);
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-1 text-sm text-gray-500">
            {total > 0 ? `${total} total` : "No notifications"}
            {unread > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                {unread} unread
              </span>
            )}
          </p>
        </div>
        {hasUnread && (
          <button
            onClick={() => markMutation.mutate(undefined)}
            disabled={markMutation.isPending}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors disabled:opacity-50"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {isLoading ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">Loading…</div>
        ) : notifications.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-4xl mb-3">🔔</p>
            <p className="text-sm font-medium text-gray-500">No notifications yet</p>
            <p className="text-xs text-gray-400 mt-1">
              System alerts and activity updates will appear here
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`flex items-start gap-4 px-6 py-4 transition-colors ${
                  !n.is_read ? "bg-blue-50/60" : "hover:bg-gray-50"
                }`}
              >
                {/* Unread dot */}
                <div className="mt-1.5 flex-shrink-0 w-2">
                  {!n.is_read && (
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {n.title && (
                        <p className="text-sm font-semibold text-gray-900 truncate">{n.title}</p>
                      )}
                      <p className="text-sm text-gray-600 mt-0.5 whitespace-pre-wrap">
                        {n.message.replace(/\*/g, "")}
                      </p>
                    </div>

                    {/* Meta */}
                    <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                      <span className="text-xs text-gray-400 whitespace-nowrap">{timeAgo(n.created_at)}</span>
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">
                        {CHANNEL_LABEL[n.channel] ?? n.channel}
                      </span>
                      <span
                        className={`text-[10px] font-semibold rounded px-1.5 py-0.5 ${STATUS_COLOR[n.status] ?? "text-gray-500 bg-gray-100"}`}
                      >
                        {n.status}
                      </span>
                    </div>
                  </div>

                  {!n.is_read && (
                    <button
                      onClick={() => markOne(n.id)}
                      className="mt-1.5 text-[11px] text-blue-600 hover:underline"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
            <p className="text-xs text-gray-400">
              Page {page} of {totalPages} · {total} total
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                ← Prev
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
