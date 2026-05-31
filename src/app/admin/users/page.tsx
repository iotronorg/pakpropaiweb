"use client";
import { X } from "lucide-react";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers, createUser, updateUser, deleteUser } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate } from "@/lib/utils";
import { User, Role } from "@/types";

const ROLE_COLORS: Record<string, "blue" | "green" | "yellow" | "gray"> = {
  admin:     "blue",
  agent:     "green",
  developer: "yellow",
  client:    "gray",
};

const ALL_ROLES: Role[] = ["client", "agent", "developer", "admin"];

const BLANK_CREATE = { phone: "", name: "", email: "", role: "client" as Role };

export default function UsersPage() {
  const qc = useQueryClient();
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [roleEdit, setRoleEdit]     = useState<Role>("client");
  const [search, setSearch]         = useState("");
  const [draftSearch, setDraftSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(BLANK_CREATE);
  const [createError, setCreateError] = useState("");
  const [deleteId, setDeleteId]     = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", search],
    queryFn: () => getUsers(undefined, search ? { search } : {}).then((r) => r.data),
  });

  const users: User[] = data?.results ?? [];

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-users"] });

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      updateUser(id, { is_active }),
    onSuccess: invalidate,
  });

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) =>
      updateUser(id, { role }),
    onSuccess: () => {
      invalidate();
      setEditingId(null);
    },
  });

  const createMutation = useMutation({
    mutationFn: () => createUser({
      phone: createForm.phone,
      role:  createForm.role,
      ...(createForm.name  ? { name:  createForm.name  } : {}),
      ...(createForm.email ? { email: createForm.email } : {}),
    }),
    onSuccess: () => {
      invalidate();
      setShowCreate(false);
      setCreateForm(BLANK_CREATE);
      setCreateError("");
    },
    onError: (err: unknown) => {
      const d = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
      if (!d) { setCreateError("Failed to create user."); return; }
      const first = Object.values(d)[0];
      setCreateError(Array.isArray(first) ? String(first[0]) : typeof first === "string" ? first : "Failed to create user.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => { invalidate(); setDeleteId(null); },
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Users</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {isLoading ? "Loading…" : `${data?.count ?? users.length} user${(data?.count ?? users.length) !== 1 ? "s" : ""}`}
            {" · "}manage roles, access and details
          </p>
        </div>
        <div className="flex items-center gap-3">
          <form onSubmit={(e) => { e.preventDefault(); setSearch(draftSearch.trim()); }} className="flex gap-1">
            <input
              value={draftSearch}
              onChange={(e) => setDraftSearch(e.target.value)}
              placeholder="Search phone or name…"
              className="rounded-lg border border-[var(--border-strong)] px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-48"
            />
            <button type="submit" className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-muted)]">
              Search
            </button>
            {search && (
              <button type="button" onClick={() => { setSearch(""); setDraftSearch(""); }}
                className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-red-500 hover:bg-red-50">
                Clear
              </button>
            )}
          </form>
          <button
            onClick={() => { setShowCreate(true); setCreateForm(BLANK_CREATE); setCreateError(""); }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            + Create User
          </button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-start text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Joined</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {users.map((u) => (
                <React.Fragment key={u.id}>
                  <tr className="hover:bg-[var(--bg-muted)]">
                    <td className="px-6 py-3 font-mono text-[var(--text-muted)]">{u.phone}</td>
                    <td className="px-6 py-3 text-[var(--text-primary)]">{u.name || "—"}</td>
                    <td className="px-6 py-3">
                      <Badge label={u.role} variant={ROLE_COLORS[u.role] ?? "gray"} />
                    </td>
                    <td className="px-6 py-3">
                      <Badge
                        label={u.is_active ? "Active" : "Inactive"}
                        variant={u.is_active ? "green" : "red"}
                      />
                    </td>
                    <td className="px-6 py-3 text-[var(--text-muted)]">{formatDate(u.date_joined)}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleActive.mutate({ id: u.id, is_active: !u.is_active })}
                          disabled={toggleActive.isPending}
                          className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors disabled:opacity-50 ${
                            u.is_active
                              ? "text-red-600 border-red-200 hover:bg-red-50"
                              : "text-green-700 border-green-200 hover:bg-green-50"
                          }`}
                        >
                          {u.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(editingId === u.id ? null : u.id);
                            setRoleEdit(u.role);
                          }}
                          className="text-xs px-2.5 py-1 rounded-md border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-muted)] font-medium transition-colors"
                        >
                          Change Role
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(u.id)}
                          className="text-xs px-2.5 py-1 rounded-md border border-red-100 text-red-400 hover:bg-red-50 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  {editingId === u.id && (
                    <tr className="bg-[var(--bg-subtle)]">
                      <td colSpan={6} className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-[var(--text-muted)]">New role:</span>
                          <div className="flex gap-2">
                            {ALL_ROLES.map((r) => (
                              <button
                                key={r}
                                type="button"
                                aria-pressed={roleEdit === r}
                                onClick={() => setRoleEdit(r)}
                                className={`text-xs px-3 py-1 rounded-full border font-semibold transition-colors ${
                                  roleEdit === r
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border)] hover:border-blue-400"
                                }`}
                              >
                                {r}
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => changeRole.mutate({ id: u.id, role: roleEdit })}
                            disabled={changeRole.isPending || roleEdit === u.role}
                            className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                          >
                            {changeRole.isPending ? "Saving…" : "Apply"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-[var(--text-muted)]">
                    No users yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create User Modal ─────────────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
              <h3 className="font-semibold text-[var(--text-primary)]">Create User</h3>
              <button type="button" onClick={() => setShowCreate(false)} aria-label="Close" className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] transition-colors"><X size={16} aria-hidden="true" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Phone <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+12025551234"
                  className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Role <span className="text-red-500">*</span></label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm((f) => ({ ...f, role: e.target.value as Role }))}
                  className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ALL_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Name</label>
                <input
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Full name (optional)"
                  className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Email</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="email@example.com (optional)"
                  className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {createError && (
                <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{createError}</p>
              )}
              <div className="flex justify-end gap-3 pt-2 border-t border-[var(--border)]">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-muted)]">
                  Cancel
                </button>
                <button
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending || !createForm.phone.trim()}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {createMutation.isPending ? "Creating…" : "Create User"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ──────────────────────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDeleteId(null)}>
          <div role="dialog" aria-modal="true" aria-labelledby="delete-user-title" onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-xl bg-[var(--bg-surface)] shadow-xl p-6">
            <h3 id="delete-user-title" className="font-semibold text-[var(--text-primary)] mb-2">Delete User?</h3>
            <p className="text-sm text-[var(--text-muted)] mb-2">
              This will permanently delete the user and all their associated data.
            </p>
            <p role="alert" className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-5">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
