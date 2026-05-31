"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers, createUser, updateUser, deleteUser } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate } from "@/lib/utils";
import { User, Role } from "@/types";

interface Props {
  role: Role;
  roleLabel: string;
  roleColor: "blue" | "green" | "yellow" | "gray" | "red";
}

const EMPTY_FORM = { phone: "", name: "", email: "" };

export function UserManagementPage({ role, roleLabel, roleColor }: Props) {
  const qc = useQueryClient();
  const queryKey = ["admin-users", role];

  const [detailUser,   setDetailUser]   = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm,      setAddForm]      = useState(EMPTY_FORM);
  const [addError,     setAddError]     = useState("");
  const [editId,       setEditId]       = useState<string | null>(null);
  const [editForm,     setEditForm]     = useState({ name: "", email: "", ntn: "", cnic: "", is_filer: false });
  const [deleteId,     setDeleteId]     = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => getUsers(role).then((r) => r.data),
  });

  const users: User[] = data?.results ?? [];

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      updateUser(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      updateUser(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      setEditId(null);
    },
  });

  const addMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => createUser(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      setShowAddModal(false);
      setAddForm(EMPTY_FORM);
      setAddError("");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { phone?: string[]; detail?: string } } })
          ?.response?.data?.phone?.[0] ??
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Failed to create user.";
      setAddError(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      setDeleteId(null);
    },
  });

  function openEdit(u: User) {
    setEditId(u.id);
    setEditForm({ name: u.name ?? "", email: u.email ?? "", ntn: u.ntn ?? "", cnic: u.cnic ?? "", is_filer: u.is_filer });
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{roleLabel}s</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {isLoading ? "Loading…" : `${users.length} ${roleLabel.toLowerCase()}${users.length !== 1 ? "s" : ""}`}
            {" · "}manage access and details
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setShowAddModal(true); setAddError(""); setAddForm(EMPTY_FORM); }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          + Add {roleLabel}
        </button>
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
                <th className="px-6 py-3">Email</th>
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
                    <td className="px-6 py-3 text-[var(--text-primary)]">{u.name || <span className="text-[var(--text-faint)]">—</span>}</td>
                    <td className="px-6 py-3 text-[var(--text-muted)]">{u.email || <span className="text-[var(--text-faint)]">—</span>}</td>
                    <td className="px-6 py-3">
                      <Badge
                        label={u.is_active ? "Active" : "Inactive"}
                        variant={u.is_active ? "green" : "red"}
                      />
                    </td>
                    <td className="px-6 py-3 text-[var(--text-muted)] whitespace-nowrap">{formatDate(u.date_joined)}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setDetailUser(u)}
                          className="text-xs px-2.5 py-1 rounded-md border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-muted)] font-medium"
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(u)}
                          className="text-xs px-2.5 py-1 rounded-md border border-[var(--border)] text-blue-600 hover:bg-blue-50 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleActive.mutate({ id: u.id, is_active: !u.is_active })}
                          disabled={toggleActive.isPending}
                          className={`text-xs px-2.5 py-1 rounded-md border font-medium disabled:opacity-50 ${
                            u.is_active
                              ? "text-red-600 border-red-200 hover:bg-red-50"
                              : "text-green-700 border-green-200 hover:bg-green-50"
                          }`}
                        >
                          {u.is_active ? "Deactivate" : "Activate"}
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

                  {/* Inline edit row */}
                  {editId === u.id && (
                    <tr className="bg-[var(--bg-subtle)]">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="flex flex-wrap gap-3 items-center">
                          <input
                            type="text"
                            placeholder="Name"
                            value={editForm.name}
                            onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                            className="rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-sm outline-none focus:border-blue-500 w-40"
                          />
                          <input
                            type="email"
                            placeholder="Email"
                            value={editForm.email}
                            onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                            className="rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-sm outline-none focus:border-blue-500 w-48"
                          />
                          <input
                            type="text"
                            placeholder="National ID"
                            value={editForm.cnic}
                            onChange={(e) => setEditForm((p) => ({ ...p, cnic: e.target.value }))}
                            className="rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-sm font-mono outline-none focus:border-blue-500 w-44"
                          />
                          <input
                            type="text"
                            placeholder="Tax ID"
                            value={editForm.ntn}
                            onChange={(e) => setEditForm((p) => ({ ...p, ntn: e.target.value }))}
                            className="rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-sm font-mono outline-none focus:border-blue-500 w-28"
                          />
                          <label className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={editForm.is_filer}
                              onChange={(e) => setEditForm((p) => ({ ...p, is_filer: e.target.checked }))}
                              className="rounded border-[var(--border-strong)] accent-blue-600"
                            />
                            Tax Filer
                          </label>
                          <button
                            type="button"
                            onClick={() => editMutation.mutate({ id: u.id, data: editForm })}
                            disabled={editMutation.isPending}
                            className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                          >
                            {editMutation.isPending ? "Saving…" : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditId(null)}
                            className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
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
                  <td colSpan={6} className="px-6 py-12 text-center text-[var(--text-muted)]">
                    No {roleLabel.toLowerCase()}s yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add User Modal ──────────────────────────────────────────────────── */}
      {showAddModal && (
        <Modal title={`Add ${roleLabel}`} onClose={() => setShowAddModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="+12125551234"
                value={addForm.phone}
                onChange={(e) => setAddForm((p) => ({ ...p, phone: e.target.value }))}
                className="w-full rounded-lg border border-[var(--border-strong)] px-3 py-2 text-sm font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-[var(--text-muted)]">International format: +[country code][number]</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Name</label>
              <input
                type="text"
                placeholder="Full name"
                value={addForm.name}
                onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full rounded-lg border border-[var(--border-strong)] px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Email</label>
              <input
                type="email"
                placeholder="email@example.com"
                value={addForm.email}
                onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))}
                className="w-full rounded-lg border border-[var(--border-strong)] px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {addError && (
              <p role="alert" className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {addError}
              </p>
            )}
            <div className="flex justify-end gap-3 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => addMutation.mutate({ ...addForm, role })}
                disabled={addMutation.isPending || !addForm.phone}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {addMutation.isPending ? "Creating…" : `Create ${roleLabel}`}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Details Modal ───────────────────────────────────────────────────── */}
      {detailUser && (
        <Modal title={`${roleLabel} Details`} onClose={() => setDetailUser(null)}>
          <div className="space-y-3">
            <DetailRow label="Phone"       value={detailUser.phone} mono />
            <DetailRow label="Name"        value={detailUser.name} />
            <DetailRow label="Email"       value={detailUser.email} />
            <DetailRow label="Role">
              <Badge label={roleLabel} variant={roleColor} />
            </DetailRow>
            <DetailRow label="Status">
              <Badge
                label={detailUser.is_active ? "Active" : "Inactive"}
                variant={detailUser.is_active ? "green" : "red"}
              />
            </DetailRow>
            <DetailRow label="Joined"      value={formatDate(detailUser.date_joined)} />
            <DetailRow label="Last Active" value={detailUser.last_active ? formatDate(detailUser.last_active) : undefined} />
            <DetailRow label="National ID" value={detailUser.cnic} mono />
            <DetailRow label="Tax ID"      value={detailUser.ntn} mono />
            <DetailRow label="Tax Filer"   value={detailUser.is_filer ? "Yes" : "No"} />
          </div>
        </Modal>
      )}

      {/* ── Delete Confirm Modal ────────────────────────────────────────────── */}
      {deleteId && (
        <Modal title="Confirm Delete" onClose={() => setDeleteId(null)}>
          <p className="text-sm text-[var(--text-muted)] mb-3">
            Are you sure you want to permanently delete this {roleLabel.toLowerCase()}? This cannot be undone.
          </p>
          <p role="alert" className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-5">
            All associated data will be removed.
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setDeleteId(null)}
              className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const titleId = `ump-modal-${title.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <h3 id={titleId} className="font-semibold text-[var(--text-primary)]">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] transition-colors">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
  children,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[var(--border-subtle)] last:border-0">
      <span className="text-sm text-[var(--text-muted)] w-28 flex-shrink-0">{label}</span>
      {children ?? (
        <span className={`text-sm text-right ${mono ? "font-mono" : ""} ${!value ? "text-[var(--text-faint)]" : "text-[var(--text-primary)]"}`}>
          {value || "—"}
        </span>
      )}
    </div>
  );
}
