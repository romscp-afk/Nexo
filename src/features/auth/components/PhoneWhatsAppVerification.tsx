import { useEffect, useState, useCallback } from 'react'
import { MessageCircle, ShieldCheck } from 'lucide-react'
import { whatsappVerificationService } from '@/shared/services/whatsappVerificationService'
import { formatSgPhoneDisplay, isValidSgMobileInput, maskSgPhone } from '@/shared/lib/phone'
import { cn } from '@/shared/lib/utils'

export type PhoneVerificationState = {
  verified: boolean
  verificationId: string | null
  phoneE164: string | null
  maskedPhone: string | null
}

type PhoneWhatsAppVerificationProps = {
  phone: string
  onPhoneChange: (phone: string) => void
  disabled?: boolean
  onVerifiedChange: (state: PhoneVerificationState) => void
  inputClass?: string
}

export function PhoneWhatsAppVerification({
  phone,
  onPhoneChange,
  disabled = false,
  onVerifiedChange,
  inputClass = 'mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm',
}: PhoneWhatsAppVerificationProps) {
  const [otp, setOtp] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [verified, setVerified] = useState(false)
  const [verificationId, setVerificationId] = useState<string | null>(null)
  const [phoneE164, setPhoneE164] = useState<string | null>(null)
  const [maskedPhone, setMaskedPhone] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [resendIn, setResendIn] = useState(0)

  const emitState = useCallback(
    (next: Partial<PhoneVerificationState> & { verified: boolean }) => {
      onVerifiedChange({
        verified: next.verified,
        verificationId: next.verificationId ?? verificationId,
        phoneE164: next.phoneE164 ?? phoneE164,
        maskedPhone: next.maskedPhone ?? maskedPhone,
      })
    },
    [onVerifiedChange, verificationId, phoneE164, maskedPhone],
  )

  useEffect(() => {
    if (resendIn <= 0) return
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [resendIn])

  const resetVerification = () => {
    setVerified(false)
    setVerificationId(null)
    setPhoneE164(null)
    setMaskedPhone(null)
    setCodeSent(false)
    setOtp('')
    emitState({ verified: false, verificationId: null, phoneE164: null, maskedPhone: null })
  }

  const handlePhoneChange = (value: string) => {
    onPhoneChange(value)
    if (verified || codeSent) resetVerification()
    setError('')
    setInfo('')
  }

  const handleSendCode = async () => {
    setError('')
    setInfo('')
    if (!isValidSgMobileInput(phone)) {
      setError('Enter a valid Singapore mobile number (8 digits, starts with 6, 8, or 9).')
      return
    }
    setSending(true)
    const { data, error: err } = await whatsappVerificationService.sendCode(phone)
    setSending(false)
    if (err || !data) {
      setError(err ?? 'Could not send WhatsApp code.')
      return
    }
    setCodeSent(true)
    setVerificationId(data.verificationId)
    setPhoneE164(data.phoneE164)
    setMaskedPhone(data.maskedPhone)
    setResendIn(60)
    setInfo(
      data.devOtp
        ? `Dev mode: your code is ${data.devOtp} (also sent via WhatsApp when configured).`
        : `We sent a 6-digit code to WhatsApp ${data.maskedPhone}.`,
    )
  }

  const handleVerifyCode = async () => {
    setError('')
    setInfo('')
    if (!/^\d{6}$/.test(otp.trim())) {
      setError('Enter the 6-digit code from WhatsApp.')
      return
    }
    setVerifying(true)
    const { data, error: err } = await whatsappVerificationService.verifyCode(phone, otp.trim())
    setVerifying(false)
    if (err || !data) {
      setError(err ?? 'Verification failed.')
      return
    }
    setVerified(true)
    setVerificationId(data.verificationId)
    setPhoneE164(data.phoneE164)
    setMaskedPhone(data.maskedPhone)
    setInfo(`WhatsApp verified · ${formatSgPhoneDisplay(data.phoneE164)}`)
    emitState({
      verified: true,
      verificationId: data.verificationId,
      phoneE164: data.phoneE164,
      maskedPhone: data.maskedPhone,
    })
  }

  return (
    <div className="rounded-xl border border-nexo-200 bg-nexo-50/60 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-nexo-600 text-white">
          <MessageCircle className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-900">Verify your phone via WhatsApp</p>
          <p className="mt-0.5 text-xs text-slate-600">
            Required for all new accounts. We&apos;ll send a one-time code to your WhatsApp number.
          </p>
        </div>
        {verified && (
          <span className="inline-flex items-center gap-1 rounded-full bg-nexo-100 px-2.5 py-1 text-xs font-medium text-nexo-800">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified
          </span>
        )}
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <label htmlFor="wa-phone" className="block text-sm font-medium text-slate-700">
            Phone (Singapore)
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id="wa-phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="91234567"
              pattern="[689]\d{7}"
              className={cn(inputClass, 'mt-0 flex-1')}
              required
              disabled={disabled || verified}
            />
            <button
              type="button"
              onClick={() => void handleSendCode()}
              disabled={disabled || verified || sending || resendIn > 0}
              className="shrink-0 rounded-lg bg-nexo-600 px-3 py-2 text-sm font-medium text-white hover:bg-nexo-700 disabled:opacity-50"
            >
              {sending ? 'Sending…' : resendIn > 0 ? `${resendIn}s` : codeSent ? 'Resend' : 'Send code'}
            </button>
          </div>
        </div>

        {codeSent && !verified && (
          <div>
            <label htmlFor="wa-otp" className="block text-sm font-medium text-slate-700">
              WhatsApp code
            </label>
            <div className="mt-1 flex gap-2">
              <input
                id="wa-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className={cn(inputClass, 'mt-0 flex-1 tracking-widest')}
                disabled={disabled || verifying}
              />
              <button
                type="button"
                onClick={() => void handleVerifyCode()}
                disabled={disabled || verifying || otp.length !== 6}
                className="shrink-0 rounded-lg border border-nexo-600 bg-white px-3 py-2 text-sm font-medium text-nexo-700 hover:bg-nexo-50 disabled:opacity-50"
              >
                {verifying ? 'Checking…' : 'Verify'}
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        {info && (
          <p className="rounded-lg bg-white px-3 py-2 text-sm text-nexo-800 ring-1 ring-nexo-200" role="status">
            {verified ? (
              <>
                {info}
                {maskedPhone && (
                  <span className="mt-1 block text-xs text-slate-500">{maskSgPhone(phoneE164 ?? '')}</span>
                )}
              </>
            ) : (
              info
            )}
          </p>
        )}
      </div>
    </div>
  )
}
