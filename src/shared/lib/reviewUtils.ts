/** Display a reviewer name publicly without exposing full identity. */
export function formatReviewerName(fullName?: string | null): string {
  if (!fullName?.trim()) return 'Verified customer'
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]!
  return `${parts[0]} ${parts[parts.length - 1]![0]}.`
}
