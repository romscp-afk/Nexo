import { useState } from 'react'
import { useAdminUsers, useDeleteUser, useSetUserActive, useSetUserRole } from '@/features/admin/hooks/useAdmin'
import { QueryState } from '@/features/catalog/components/CatalogUi'
import { formatSgPhoneDisplay, whatsAppHref } from '@/shared/lib/phone'
import type { UserRole } from '@/shared/lib/constants'

const ASSIGNABLE_ROLES: UserRole[] = ['customer', 'provider', 'admin']

const ROLE_LABELS: Record<UserRole, string> = {
  customer: 'Customer',
  provider: 'Provider',
  admin: 'Admin',
}

function ContactCell({ value, kind }: { value: string | null; kind: 'phone' | 'whatsapp' }) {
  if (!value) {
    return <span className="text-slate-400">—</span>
  }

  const label = formatSgPhoneDisplay(value)

  if (kind === 'whatsapp') {
    return (
      <a
        href={whatsAppHref(value)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-nexo-700 hover:underline"
      >
        {label}
      </a>
    )
  }

  return (
    <a href={`tel:${value}`} className="text-slate-700 hover:underline">
      {label}
    </a>
  )
}

export function AdminUsersPage() {
  const { data: users, isLoading, error } = useAdminUsers()
  const setActive = useSetUserActive()
  const setRole = useSetUserRole()
  const deleteUser = useDeleteUser()
  const [actionError, setActionError] = useState('')

  const toggleActive = async (userId: string, isActive: boolean) => {
    setActionError('')
    try {
      await setActive.mutateAsync({ userId, isActive: !isActive })
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Update failed')
    }
  }

  const changeRole = async (user: { userId: string; email: string; role: UserRole }, nextRole: UserRole) => {
    if (nextRole === user.role) return

    const demotingProvider = user.role === 'provider' && nextRole !== 'provider'
    const promotingAdmin = nextRole === 'admin'

    let message = `Change ${user.email} from ${ROLE_LABELS[user.role]} to ${ROLE_LABELS[nextRole]}?`
    if (demotingProvider) {
      message += ' Their provider listing will be removed.'
    }
    if (promotingAdmin) {
      message += ' They will get full admin access.'
    }

    if (!window.confirm(message)) return

    setActionError('')
    try {
      await setRole.mutateAsync({ userId: user.userId, role: nextRole })
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Role update failed')
    }
  }

  const removeUser = async (userId: string, email: string) => {
    if (
      !window.confirm(
        `Permanently remove ${email}? This deletes their account, profile, and all related data. This cannot be undone.`,
      )
    ) {
      return
    }

    setActionError('')
    try {
      await deleteUser.mutateAsync(userId)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Remove failed')
    }
  }

  const actionPending = setActive.isPending || setRole.isPending || deleteUser.isPending

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Users</h1>
      <p className="mt-1 text-slate-600">Manage platform accounts, roles, contact details, and access.</p>

      {actionError && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</p>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <QueryState loading={isLoading} error={error} empty={!users?.length}>
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">WhatsApp</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users?.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 font-medium">{user.fullName}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">
                    <ContactCell value={user.phone} kind="phone" />
                  </td>
                  <td className="px-4 py-3">
                    <ContactCell value={user.whatsApp} kind="whatsapp" />
                  </td>
                  <td className="px-4 py-3">
                    {user.role === 'admin' ? (
                      <span className="capitalize text-slate-700">{user.role}</span>
                    ) : (
                      <select
                        value={user.role}
                        onChange={(e) =>
                          void changeRole(user, e.target.value as UserRole)
                        }
                        disabled={actionPending}
                        aria-label={`Role for ${user.fullName}`}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700"
                      >
                        {ASSIGNABLE_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        user.isActive ? 'text-green-700' : 'text-slate-400 line-through'
                      }
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.role !== 'admin' ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleActive(user.userId, user.isActive)}
                          disabled={actionPending}
                          className="text-nexo-700 hover:underline disabled:opacity-50"
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeUser(user.userId, user.email)}
                          disabled={actionPending}
                          className="text-red-600 hover:underline disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400">Protected</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </QueryState>
      </div>
    </div>
  )
}
