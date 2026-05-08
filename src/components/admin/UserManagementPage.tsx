"use client";

import { useState } from "react";
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
          <h1 className="text-2xl font-bold text-gray-900">{roleLabel}s</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isLoading ? "Loading…" : `${users.length} ${roleLabel.toLowerCase()}${users.length !== 1 ? "s" : ""}`}
            {" · "}manage access and details
          </p>
        </div>
        <button
          onClick={() => { setShowAddModal(true); setAddError(""); setAddForm(EMPTY_FORM); }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          + Add {roleLabel}
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Joined</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <>
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-mono text-gray-700">{u.phone}</td>
                    <td className="px-6 py-3 text-gray-800">{u.name || <span className="text-gray-300">—</span>}</td>
                    <td className="px-6 py-3 text-gray-500">{u.email || <span className="text-gray-300">—</span>}</td>
                    <td className="px-6 py-3">
                      <Badge
                        label={u.is_active ? "Active" : "Inactive"}
                        variant={u.is_active ? "green" : "red"}
                      />
                    </td>
                    <td className="px-6 py-3 text-gray-500 whitespace-nowrap">{formatDate(u.date_joined)}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => setDetailUser(u)}
                          className="text-xs px-2.5 py-1 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 font-medium"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => openEdit(u)}
                          className="text-xs px-2.5 py-1 rounded-md border border-gray-200 text-blue-600 hover:bg-blue-50 font-medium"
                        >
                          Edit
                        </button>
                        <button
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
                    <tr key={`${u.id}-edit`} className="bg-blue-50">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="flex flex-wrap gap-3 items-center">
                          <input
                            type="text"
                            placeholder="Name"
                            value={editForm.name}
                            onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500 w-40"
                          />
                          <input
                            type="email"
                            placeholder="Email"
                            value={editForm.email}
                            onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500 w-48"
                          />
                          <input
                            type="text"
                            placeholder="CNIC (12345-1234567-1)"
                            value={editForm.cnic}
                            onChange={(e) => setEditForm((p) => ({ ...p, cnic: e.target.value }))}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-mono outline-none focus:border-blue-500 w-44"
                          />
                          <input
                            type="text"
                            placeholder="NTN"
                            value={editForm.ntn}
                            onChange={(e) => setEditForm((p) => ({ ...p, ntn: e.target.value }))}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-mono outline-none focus:border-blue-500 w-28"
                          />
                          <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={editForm.is_filer}
                              onChange={(e) => setEditForm((p) => ({ ...p, is_filer: e.target.checked }))}
                              className="rounded border-gray-300 accent-blue-600"
                            />
                            Tax Filer
                          </label>
                          <button
                            onClick={() => editMutation.mutate({ id: u.id, data: editForm })}
                            disabled={editMutation.isPending}
                            className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                          >
                            {editMutation.isPending ? "Saving…" : "Save"}
                          </button>
                          <button onClick={() => setEditId(null)} className="text-sm text-gray-400 hover:text-gray-600">
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                placeholder="+923001234567"
                value={addForm.phone}
                onChange={(e) => setAddForm((p) => ({ ...p, phone: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-400">Pakistani number in +92XXXXXXXXXX format</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                placeholder="Full name"
                value={addForm.name}
                onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                placeholder="email@example.com"
                value={addForm.email}
                onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {addError && (
              <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {addError}
              </p>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
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
            <DetailRow label="CNIC"        value={detailUser.cnic} mono />
            <DetailRow label="NTN"         value={detailUser.ntn} mono />
            <DetailRow label="Tax Filer"   value={detailUser.is_filer ? "Yes" : "No"} />
          </div>
        </Modal>
      )}

      {/* ── Delete Confirm Modal ────────────────────────────────────────────── */}
      {deleteId && (
        <Modal title="Confirm Delete" onClose={() => setDeleteId(null)}>
          <p className="text-sm text-gray-600 mb-6">
            Are you sure you want to permanently delete this {roleLabel.toLowerCase()}? This cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteId(null)}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
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
    <div className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 w-28 flex-shrink-0">{label}</span>
      {children ?? (
        <span className={`text-sm text-right ${mono ? "font-mono" : ""} ${!value ? "text-gray-300" : "text-gray-800"}`}>
          {value || "—"}
        </span>
      )}
    </div>
  );
}
