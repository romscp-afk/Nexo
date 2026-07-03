import { formatCurrency, formatDateTime } from '@/shared/lib/utils'
import { ceilingHeightLabel, type PriceBreakdown } from '@/shared/lib/pricing'
import type { Receipt } from '@/shared/types/receipt'
import type { Booking } from '@/shared/types/booking'

function receiptDocumentHtml(receipt: Receipt, booking?: Booking | null): string {
  const d = receipt.details
  const serviceName = String(d.service_name ?? booking?.serviceName ?? 'Service')
  const providerName = String(d.provider_name ?? booking?.providerName ?? '—')
  const categoryName = String(d.category_name ?? booking?.categoryName ?? '')
  const paymentLabel = receipt.paymentMethod === 'cash' ? 'Cash on completion' : 'PayNow'
  const pricingSnapshot = (booking?.pricingSnapshot ?? null) as PriceBreakdown | null
  const subtotal =
    booking?.serviceSubtotal ??
    (typeof d.service_subtotal === 'number' ? d.service_subtotal : null)
  const platformFee =
    booking?.platformFee ?? (typeof d.platform_fee === 'number' ? d.platform_fee : null)
  const quantity = booking?.quantity ?? (typeof d.quantity === 'number' ? d.quantity : null)
  const duration = booking?.durationHours ?? (typeof d.duration_hours === 'number' ? d.duration_hours : null)
  const ceilingHeight = pricingSnapshot?.ceilingHeight ?? null

  const jobParts: string[] = []
  if (quantity != null) {
    jobParts.push(`${quantity} unit${quantity === 1 ? '' : 's'}`)
    if (ceilingHeight) jobParts.push(ceilingHeightLabel(ceilingHeight))
  } else if (duration != null) {
    jobParts.push(`${duration} hour${duration === 1 ? '' : 's'}`)
  }
  jobParts.push(paymentLabel)
  const jobDetails = jobParts.length > 1 ? jobParts.join(' · ') : jobParts[0] ?? '—'

  const lineRows =
    pricingSnapshot?.lines?.length
      ? pricingSnapshot.lines
          .map(
            (line) =>
              `<tr><td>${line.label}</td><td style="text-align:right">${formatCurrency(line.amount)}</td></tr>`,
          )
          .join('')
      : subtotal != null
        ? `<tr><td>Service subtotal</td><td style="text-align:right">${formatCurrency(subtotal)}</td></tr>`
        : ''
  const resolvedPlatformFee = pricingSnapshot?.platformFee ?? platformFee
  const feeRow =
    resolvedPlatformFee != null
      ? `<tr><td>Platform fee</td><td style="text-align:right">${formatCurrency(resolvedPlatformFee)}</td></tr>`
      : ''

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt ${receipt.receiptNumber}</title>
  <style>
    body { font-family: system-ui, sans-serif; color: #0f172a; max-width: 640px; margin: 2rem auto; padding: 0 1rem; }
    h1 { font-size: 1.5rem; margin: 0 0 0.25rem; color: #3730a3; }
    .meta { color: #64748b; font-size: 0.875rem; margin-bottom: 1.5rem; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    td { padding: 0.5rem 0; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
    .total td { font-weight: 700; font-size: 1.125rem; border-top: 2px solid #cbd5e1; border-bottom: none; padding-top: 0.75rem; }
    .section { margin-top: 1.25rem; }
    .label { color: #64748b; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>Nexo Receipt</h1>
  <p class="meta">${receipt.receiptNumber} · ${formatDateTime(receipt.createdAt)}</p>

  <div class="section">
    <p class="label">Service</p>
    <p><strong>${serviceName}</strong>${categoryName ? ` · ${categoryName}` : ''}</p>
  </div>

  <div class="section">
    <p class="label">Provider</p>
    <p>${providerName}</p>
  </div>

  <div class="section">
    <p class="label">Job details</p>
    <p>${jobDetails}</p>
  </div>

  <table>
    ${lineRows}
    ${feeRow}
    <tr class="total">
      <td>Amount paid</td>
      <td style="text-align:right">${formatCurrency(receipt.amount)}</td>
    </tr>
  </table>

  <p style="font-size:0.75rem;color:#94a3b8;margin-top:2rem">Thank you for using Nexo · nexo-service-sepia.vercel.app</p>
</body>
</html>`
}

export function downloadReceiptPdf(receipt: Receipt, booking?: Booking | null): void {
  const html = receiptDocumentHtml(receipt, booking)
  const printWindow = window.open('', '_blank', 'noopener,noreferrer')
  if (!printWindow) {
    alert('Please allow pop-ups to download the receipt PDF.')
    return
  }
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
  }, 250)
}

export function receiptSummaryLines(receipt: Receipt, booking?: Booking | null) {
  const d = receipt.details
  return {
    serviceName: String(d.service_name ?? booking?.serviceName ?? 'Service'),
    providerName: d.provider_name != null ? String(d.provider_name) : booking?.providerName,
    categoryName: d.category_name != null ? String(d.category_name) : booking?.categoryName,
    subtotal: booking?.serviceSubtotal ?? (typeof d.service_subtotal === 'number' ? d.service_subtotal : null),
    platformFee: booking?.platformFee ?? (typeof d.platform_fee === 'number' ? d.platform_fee : null),
    quantity: booking?.quantity ?? (typeof d.quantity === 'number' ? d.quantity : null),
    durationHours: booking?.durationHours ?? (typeof d.duration_hours === 'number' ? d.duration_hours : null),
  }
}
