import { PAYNOW_MERCHANT_NAME } from '@/shared/lib/paynowConfig'

function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0')
  return `${id}${len}${value}`
}

function crc16CcittFalse(payload: string): string {
  let crc = 0xffff
  for (let i = 0; i < payload.length; i += 1) {
    crc ^= payload.charCodeAt(i) << 8
    for (let j = 0; j < 8; j += 1) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff
      } else {
        crc = (crc << 1) & 0xffff
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

function formatExpiryDate(date = new Date()): string {
  const d = new Date(date)
  d.setFullYear(d.getFullYear() + 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

function normalizeMobile(mobile: string): string {
  const trimmed = mobile.replace(/\s/g, '')
  if (trimmed.startsWith('+65')) return trimmed
  if (trimmed.startsWith('65') && trimmed.length === 10) return `+${trimmed}`
  return `+65${trimmed.replace(/^0/, '')}`
}

export type PayNowQrOptions = {
  mobile: string
  amount: number
  reference: string
  merchantName?: string
}

/** Build EMVCo SGQR PayNow payload (scan with any SG banking app). */
export function buildPayNowPayload(options: PayNowQrOptions): string {
  const mobile = normalizeMobile(options.mobile)
  const amount = options.amount.toFixed(2)
  const reference = options.reference.slice(0, 25)
  const merchantName = (options.merchantName ?? PAYNOW_MERCHANT_NAME).slice(0, 25)
  const expiry = formatExpiryDate()

  const paynowAccount =
    tlv('00', 'SG.PAYNOW') +
    tlv('01', '0') +
    tlv('02', mobile) +
    tlv('03', '0') +
    tlv('04', expiry)

  const additionalData = tlv('01', reference)

  const payloadWithoutCrc =
    tlv('00', '01') +
    tlv('01', '11') +
    tlv('26', paynowAccount) +
    tlv('52', '0000') +
    tlv('53', '702') +
    tlv('54', amount) +
    tlv('58', 'SG') +
    tlv('59', merchantName) +
    tlv('60', 'Singapore') +
    tlv('62', additionalData) +
    '6304'

  return payloadWithoutCrc + crc16CcittFalse(payloadWithoutCrc)
}

export async function payNowPayloadToDataUrl(payload: string, size = 240): Promise<string> {
  const QRCode = await import('qrcode')
  return QRCode.toDataURL(payload, {
    width: size,
    margin: 2,
    errorCorrectionLevel: 'M',
  })
}
