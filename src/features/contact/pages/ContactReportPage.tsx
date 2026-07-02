import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { Download, FileSpreadsheet, Trash2, Users } from 'lucide-react'
import { contactService } from '@/shared/services/contactService'
import { exportContactsToExcel } from '@/shared/lib/exportContactsExcel'
import { EVENT } from '@/features/gathering/lib/eventConfig'
import { legacyTheme } from '@/features/gathering/lib/legacyTheme'
import { cn } from '@/shared/lib/utils'

export function ContactReportPage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [actionError, setActionError] = useState('')

  const rows = useMemo(() => {
    void refreshKey
    const { data } = contactService.listAll()
    return data
  }, [refreshKey])

  const allSelected = rows.length > 0 && selectedIds.size === rows.length
  const someSelected = selectedIds.size > 0

  const refresh = () => {
    setSelectedIds(new Set())
    setRefreshKey((n) => n + 1)
  }

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
      return
    }
    setSelectedIds(new Set(rows.map((row) => row.id)))
  }

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleExport = () => {
    if (!rows.length) return
    exportContactsToExcel(rows, EVENT.excelFilename)
  }

  const handleClear = () => {
    if (!rows.length) return
    if (!window.confirm('Delete ALL survey responses from this browser?')) return
    setActionError('')
    contactService.clearAll()
    refresh()
  }

  const handleDeleteSelected = () => {
    if (!someSelected) return
    const count = selectedIds.size
    if (!window.confirm(`Delete ${count} selected response${count === 1 ? '' : 's'}?`)) return
    setActionError('')
    const { error } = contactService.deleteByIds([...selectedIds])
    if (error) {
      setActionError(error)
      return
    }
    refresh()
  }

  const handleDeleteOne = (id: string, name: string) => {
    if (!window.confirm(`Delete submission for "${name}"?`)) return
    setActionError('')
    const { error } = contactService.deleteById(id)
    if (error) {
      setActionError(error)
      return
    }
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    setRefreshKey((n) => n + 1)
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <p className={legacyTheme.subheading}>{EVENT.batch}</p>
        <h1 className={`mt-2 text-2xl sm:text-3xl ${legacyTheme.heading}`}>Survey Report</h1>
        <p className={`mt-2 ${legacyTheme.tagline}`}>&ldquo;{EVENT.tagline}&rdquo;</p>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-legacy-silver">
          All survey responses for {EVENT.title}. Export to Excel or review the grid below.
        </p>
      </div>

      {actionError && (
        <p className="mb-4 rounded-lg border border-legacy-red/40 bg-legacy-red/10 px-3 py-2 text-sm text-red-300">
          {actionError}
        </p>
      )}

      <div className={`mb-6 flex flex-wrap items-center justify-between gap-4 p-4 ${legacyTheme.card}`}>
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-legacy-gold text-legacy-950">
            <Users className="h-6 w-6" />
          </span>
          <div>
            <p className="text-2xl font-bold text-legacy-silver-light">{rows.length}</p>
            <p className="text-sm text-legacy-silver">
              Survey response{rows.length === 1 ? '' : 's'}
              {someSelected && ` · ${selectedIds.size} selected`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/contact/entry" className={legacyTheme.btnSecondary}>
            Survey Form
          </Link>
          <button
            type="button"
            onClick={handleExport}
            disabled={!rows.length}
            className={`inline-flex items-center gap-2 disabled:opacity-50 ${legacyTheme.btnPrimary}`}
          >
            <Download className="h-4 w-4" />
            Download Excel
          </button>
          <button
            type="button"
            onClick={handleDeleteSelected}
            disabled={!someSelected}
            className={`inline-flex items-center gap-2 disabled:opacity-50 ${legacyTheme.btnSecondary}`}
          >
            <Trash2 className="h-4 w-4" />
            Delete selected
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={!rows.length}
            className={`inline-flex items-center gap-2 disabled:opacity-50 ${legacyTheme.btnSecondary}`}
          >
            <Trash2 className="h-4 w-4" />
            Delete all
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-xl border border-dashed border-legacy-gold/30 bg-legacy-gold/5 px-4 py-3 text-sm text-legacy-gold">
        <FileSpreadsheet className="h-4 w-4 shrink-0" />
        <span>
          Excel file: <strong>{EVENT.excelFilename}</strong> — name, school, contact, WhatsApp, email, work place,
          designation & feedback.
        </span>
      </div>

      <div className={`overflow-hidden ${legacyTheme.card}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className={legacyTheme.tableHead}>
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    disabled={!rows.length}
                    aria-label="Select all"
                    className="h-4 w-4 rounded border-legacy-silver/40 accent-[#c9a96e]"
                  />
                </th>
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">School</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">WhatsApp</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Work Place</th>
                <th className="px-4 py-3 font-semibold">Designation</th>
                <th className="px-4 py-3 font-semibold">Feedback</th>
                <th className="px-4 py-3 font-semibold">Submitted</th>
                <th className="px-4 py-3 font-semibold">Delete</th>
              </tr>
            </thead>
            <tbody className="text-legacy-silver-light">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-legacy-silver">
                    No responses yet.
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr
                    key={row.id}
                    className={cn(
                      'border-b border-legacy-silver/10 transition hover:bg-legacy-800/50 even:bg-legacy-950/30',
                      selectedIds.has(row.id) && 'bg-legacy-gold/5',
                    )}
                  >
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.id)}
                        onChange={() => toggleOne(row.id)}
                        aria-label={`Select ${row.fullName}`}
                        className="h-4 w-4 rounded border-legacy-silver/40 accent-[#c9a96e]"
                      />
                    </td>
                    <td className="px-4 py-3 text-legacy-gold">{index + 1}</td>
                    <td className="px-4 py-3 font-medium">{row.fullName}</td>
                    <td className="px-4 py-3">{row.school}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{row.contactNumber}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {row.whatsAppNumber || (row.contactIsWhatsApp ? row.contactNumber : '—')}
                    </td>
                    <td className="px-4 py-3">{row.email}</td>
                    <td className="px-4 py-3">{row.workPlace || '—'}</td>
                    <td className="px-4 py-3">{row.designation || '—'}</td>
                    <td className="max-w-xs truncate px-4 py-3" title={row.feedback ?? ''}>
                      {row.feedback || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-legacy-silver">
                      {format(new Date(row.createdAt), 'dd MMM yyyy, HH:mm')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleDeleteOne(row.id, row.fullName)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-legacy-red hover:bg-legacy-red/10"
                        aria-label={`Delete ${row.fullName}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
