"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers, updateUser } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate } from "@/lib/utils";
import { User, Role } from "@/types";

const ROLE_COLORS: Record<string, "blue" | "green" | "yellow" | "gray"> = {
  admin:     "blue",
  agent:     "green",
  developer: "yellow",
  user:      "gray",
};

const ALL_ROLES: Role[] = ["user", "agent", "developer", "admin"];

export default function UsersPage() {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [roleEdit, setRoleEdit]   = useState<Role>("user");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => getUsers().then((r) => r.data),
  });

  const users: User[] = data?.results ?? [];

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      updateUser(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) =>
      updateUser(id, { role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setEditingId(null);
    },
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-500">
            {users.length} user{users.length !== 1 ? "s" : ""} · manage roles and access
          </p>
        </div>
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
                <th className="px-6 py-3">Role</th>
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
                    <td className="px-6 py-3 text-gray-800">{u.name || "—"}</td>
                    <td className="px-6 py-3">
                      <Badge label={u.role} variant={ROLE_COLORS[u.role] ?? "gray"} />
                    </td>
                    <td className="px-6 py-3">
                      <Badge
                        label={u.is_active ? "Active" : "Inactive"}
                        variant={u.is_active ? "green" : "red"}
                      />
                    </td>
                    <td className="px-6 py-3 text-gray-500">{formatDate(u.date_joined)}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <button
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
                          onClick={() => {
                            setEditingId(editingId === u.id ? null : u.id);
                            setRoleEdit(u.role);
                          }}
                          className="text-xs px-2.5 py-1 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 font-medium transition-colors"
                        >
                          Change Role
                        </button>
                      </div>
                    </td>
                  </tr>
                  {editingId === u.id && (
                    <tr key={`${u.id}-role`} className="bg-blue-50">
                      <td colSpan={6} className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-gray-600">New role:</span>
                          <div className="flex gap-2">
                            {ALL_ROLES.map((r) => (
                              <button
                                key={r}
                                onClick={() => setRoleEdit(r)}
                                className={`text-xs px-3 py-1 rounded-full border font-semibold transition-colors ${
                                  roleEdit === r
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"
                                }`}
                              >
                                {r}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => changeRole.mutate({ id: u.id, role: roleEdit })}
                            disabled={changeRole.isPending || roleEdit === u.role}
                            className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                          >
                            {changeRole.isPending ? "Saving…" : "Apply"}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-xs text-gray-400 hover:text-gray-600"
                          >
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
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                    No users yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
