import { DEFAULT_PHONE_COUNTRY_CODE, PHONE_COUNTRY_CODES } from '@/features/gathering/lib/phoneCodes'
import { cn } from '@/shared/lib/utils'

type PhoneNumberFieldProps = {
  countryCode: string
  localNumber: string
  onCountryCodeChange: (value: string) => void
  onLocalNumberChange: (value: string) => void
  idPrefix: string
  label: string
  required?: boolean
  optional?: boolean
  labelClassName: string
  inputClassName: string
  accentClassName: string
  mutedClassName: string
}

export function PhoneNumberField({
  countryCode,
  localNumber,
  onCountryCodeChange,
  onLocalNumberChange,
  idPrefix,
  label,
  required = false,
  optional = false,
  labelClassName,
  inputClassName,
  accentClassName,
  mutedClassName,
}: PhoneNumberFieldProps) {
  return (
    <div>
      <label htmlFor={`${idPrefix}-local`} className={labelClassName}>
        {label}{' '}
        {required ? (
          <span className={accentClassName}>*</span>
        ) : optional ? (
          <span className={mutedClassName}>(optional)</span>
        ) : null}
      </label>
      <div className="mt-1.5 flex gap-2">
        <select
          id={`${idPrefix}-code`}
          value={countryCode || DEFAULT_PHONE_COUNTRY_CODE}
          onChange={(e) => onCountryCodeChange(e.target.value)}
          className={cn(inputClassName, 'mt-0 w-[7.25rem] shrink-0 px-2.5 sm:w-[8.5rem]')}
          aria-label={`${label} country code`}
        >
          {PHONE_COUNTRY_CODES.map((item) => (
            <option key={item.code} value={item.code}>
              {item.label}
            </option>
          ))}
        </select>
        <input
          id={`${idPrefix}-local`}
          type="tel"
          inputMode="tel"
          value={localNumber}
          onChange={(e) => onLocalNumberChange(e.target.value)}
          className={cn(inputClassName, 'mt-0 min-w-0 flex-1')}
          placeholder="77 123 4567"
          required={required}
          autoComplete="tel-national"
        />
      </div>
    </div>
  )
}
