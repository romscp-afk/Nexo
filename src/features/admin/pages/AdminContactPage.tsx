import { useAdminContactMessages } from '@/features/admin/hooks/useAdmin'
import { QueryState } from '@/features/catalog/components/CatalogUi'
import { formatDateTime } from '@/shared/lib/utils'

export function AdminContactPage() {
  const { data: messages, isLoading, error } = useAdminContactMessages()

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Contact messages</h1>
      <p className="mt-1 text-slate-600">
        Messages submitted through the public contact form. You also receive an email notification
        for each new message.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <QueryState loading={isLoading} error={error} empty={!messages?.length}>
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Received</th>
                <th className="px-4 py-3 font-medium">From</th>
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="px-4 py-3 font-medium">Message</th>
                <th className="px-4 py-3 font-medium">Email sent</th>
              </tr>
            </thead>
            <tbody>
              {messages?.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 align-top last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                    {formatDateTime(row.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{row.fullName}</p>
                    <a href={`mailto:${row.email}`} className="text-nexo-700 hover:underline">
                      {row.email}
                    </a>
                    {row.phone && <p className="mt-1 text-xs text-slate-500">{row.phone}</p>}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{row.subject}</td>
                  <td className="max-w-md px-4 py-3 whitespace-pre-wrap text-slate-700">
                    {row.message}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {row.emailSentAt ? formatDateTime(row.emailSentAt) : 'Pending / skipped'}
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
