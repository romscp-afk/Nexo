// Legal policy drafts require review by a Singapore-qualified lawyer before production launch.
import { Link } from 'react-router-dom'
import {
  LEGAL_BUSINESS,
  formatLegalDate,
  hasLegalEntityConfigured,
  privacyContactDisplay,
  publicTradingName,
} from '@/shared/lib/legalBusinessConfig'
import { PAGE_META, usePageMeta } from '@/shared/lib/pageMeta'

function LegalMetaDates() {
  const effective = formatLegalDate(LEGAL_BUSINESS.effectiveDate)
  const updated = formatLegalDate(LEGAL_BUSINESS.lastUpdatedDate)
  return (
    <p className="mt-2 text-sm text-slate-600">
      {effective && (
        <>
          Effective date: <time dateTime={LEGAL_BUSINESS.effectiveDate}>{effective}</time>
        </>
      )}
      {effective && updated && <br />}
      {updated && (
        <>
          Last updated: <time dateTime={LEGAL_BUSINESS.lastUpdatedDate}>{updated}</time>
        </>
      )}
    </p>
  )
}

function LegalEntityBlock({ privacy }: { privacy?: boolean }) {
  const name = publicTradingName()
  if (!hasLegalEntityConfigured()) {
    return (
      <p className="mt-2 text-sm text-slate-600">
        Contact {name} through the{' '}
        <Link to="/support" className="font-medium text-nexo-700 hover:underline">
          Support
        </Link>{' '}
        page
        {privacy ? ' for privacy enquiries' : ''}.
      </p>
    )
  }
  const contact = privacyContactDisplay()
  return (
    <div className="mt-3 space-y-1 text-sm text-slate-600">
      <p>
        <span className="font-medium text-slate-800">{LEGAL_BUSINESS.legalBusinessName}</span>
        {LEGAL_BUSINESS.tradingName && LEGAL_BUSINESS.tradingName !== LEGAL_BUSINESS.legalBusinessName
          ? ` (trading as ${LEGAL_BUSINESS.tradingName})`
          : null}
      </p>
      <p>UEN: {LEGAL_BUSINESS.uen}</p>
      <p>{LEGAL_BUSINESS.registeredAddress}</p>
      {contact && (
        <p>
          {privacy ? 'Privacy contact: ' : 'Contact: '}
          <a href={`mailto:${contact}`} className="font-medium text-nexo-700 hover:underline">
            {contact}
          </a>
        </p>
      )}
      <p>
        Or use the{' '}
        <Link to="/support" className="font-medium text-nexo-700 hover:underline">
          Support
        </Link>{' '}
        page.
      </p>
    </div>
  )
}

const prose = {
  wrap: 'mx-auto max-w-3xl pb-16',
  h1: 'text-3xl font-bold text-slate-900',
  h2: 'mt-10 text-xl font-semibold text-slate-900',
  h3: 'mt-6 text-base font-semibold text-slate-900',
  p: 'mt-3 text-sm leading-relaxed text-slate-700',
  ul: 'mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-700',
}

export function PrivacyPage() {
  usePageMeta(PAGE_META.privacy)
  const brand = publicTradingName()

  return (
    <article className={prose.wrap}>
      <h1 className={prose.h1}>Privacy Policy</h1>
      <LegalMetaDates />
      <p className={prose.p}>
        {brand} respects your privacy and is committed to handling personal data responsibly. This
        Privacy Policy explains how {brand} collects, uses, discloses, protects and retains personal
        data when you use our website, progressive web application and related services.
      </p>

      <h2 className={prose.h2}>1. Who this policy applies to</h2>
      <p className={prose.p}>This policy applies to:</p>
      <ul className={prose.ul}>
        <li>customers;</li>
        <li>cleaning service providers;</li>
        <li>cleaning companies;</li>
        <li>website visitors;</li>
        <li>people who contact {brand} for support; and</li>
        <li>authorised representatives of business accounts.</li>
      </ul>

      <h2 className={prose.h2}>2. Personal data we may collect</h2>
      <p className={prose.p}>Depending on how you use {brand}, we may collect:</p>

      <h3 className={prose.h3}>Account information</h3>
      <ul className={prose.ul}>
        <li>full name;</li>
        <li>email address;</li>
        <li>mobile number;</li>
        <li>account role;</li>
        <li>authentication and account-security information; and</li>
        <li>communication preferences.</li>
      </ul>

      <h3 className={prose.h3}>Customer and booking information</h3>
      <ul className={prose.ul}>
        <li>service address;</li>
        <li>postal code;</li>
        <li>property type;</li>
        <li>bedrooms and bathrooms;</li>
        <li>cleaning requirements;</li>
        <li>preferred date and time;</li>
        <li>booking duration;</li>
        <li>service-area information;</li>
        <li>booking notes;</li>
        <li>booking status;</li>
        <li>provider assignment;</li>
        <li>payment method;</li>
        <li>payment reference; and</li>
        <li>customer support records.</li>
      </ul>

      <h3 className={prose.h3}>Service-provider information</h3>
      <ul className={prose.ul}>
        <li>individual or company listing type;</li>
        <li>service profile;</li>
        <li>years of experience;</li>
        <li>service areas;</li>
        <li>availability;</li>
        <li>services offered;</li>
        <li>booking activity;</li>
        <li>payout information;</li>
        <li>ratings and reviews;</li>
        <li>verification status; and</li>
        <li>documents provided for account or eligibility review.</li>
      </ul>
      <p className={prose.p}>
        We do not request NRIC, passport or work-pass information unless there is a documented legal
        and operational need, restricted admin access, a retention schedule and appropriate security
        controls.
      </p>

      <h3 className={prose.h3}>Technical and usage information</h3>
      <ul className={prose.ul}>
        <li>device and browser information;</li>
        <li>IP address;</li>
        <li>pages viewed;</li>
        <li>interaction events;</li>
        <li>error and performance logs;</li>
        <li>installation status;</li>
        <li>cookie or local-storage identifiers; and</li>
        <li>analytics information.</li>
      </ul>

      <h3 className={prose.h3}>Communications</h3>
      <p className={prose.p}>
        We may retain messages exchanged through {brand}, support enquiries, complaint records and
        communications needed to manage bookings or disputes.
      </p>

      <h2 className={prose.h2}>3. How we use personal data</h2>
      <p className={prose.p}>{brand} may use personal data to:</p>
      <ul className={prose.ul}>
        <li>create and secure accounts;</li>
        <li>provide customer and provider functionality;</li>
        <li>prepare and manage bookings;</li>
        <li>connect customers with suitable service providers;</li>
        <li>calculate prices, service fees and provider payouts;</li>
        <li>process or verify payments;</li>
        <li>provide booking notifications;</li>
        <li>enable customer-provider communication;</li>
        <li>review service-provider applications;</li>
        <li>prevent fraud, misuse and security incidents;</li>
        <li>investigate complaints and disputes;</li>
        <li>provide customer support;</li>
        <li>improve usability, reliability and performance;</li>
        <li>comply with legal and regulatory obligations; and</li>
        <li>send marketing communications where permitted and not opted out.</li>
      </ul>

      <h2 className={prose.h2}>4. Disclosure of personal data</h2>
      <p className={prose.p}>{brand} may disclose relevant personal data to:</p>
      <ul className={prose.ul}>
        <li>the customer or service provider connected to a booking;</li>
        <li>technology, hosting, database, authentication, analytics and communication providers;</li>
        <li>payment-service providers;</li>
        <li>professional advisers;</li>
        <li>insurers where applicable;</li>
        <li>regulators, law-enforcement bodies or public authorities where required; and</li>
        <li>another organisation involved in a lawful business transfer.</li>
      </ul>
      <p className={prose.p}>
        Only information reasonably necessary for the applicable purpose should be disclosed. A
        customer&apos;s service address and contact details must not be shown to unrelated providers.
        Reveal booking-specific customer details only to an assigned or properly authorised provider.
      </p>

      <h2 className={prose.h2}>5. Consent and withdrawal</h2>
      <p className={prose.p}>
        Where consent is required, {brand} will notify you of the purposes for collecting, using or
        disclosing personal data. You may withdraw consent by contacting {brand}. Withdrawal will not
        affect actions already taken with valid consent. Some services may no longer be available
        where the relevant information is necessary to provide them.
      </p>

      <h2 className={prose.h2}>6. Access and correction</h2>
      <p className={prose.p}>
        You may request access to personal data held about you or ask for inaccurate information to be
        corrected, subject to applicable legal exceptions. {brand} may need to verify your identity
        before processing a request.
      </p>

      <h2 className={prose.h2}>7. Accuracy</h2>
      <p className={prose.p}>
        Customers and providers should keep their account information accurate and current. {brand}{' '}
        may request updated information where necessary for bookings, account security or provider
        review.
      </p>

      <h2 className={prose.h2}>8. Protection</h2>
      <p className={prose.p}>
        {brand} uses reasonable administrative, technical and organisational safeguards designed to
        protect personal data against unauthorised access, collection, use, disclosure, alteration,
        loss or similar risks. No online service can guarantee absolute security. Users should protect
        their passwords and notify {brand} of suspected unauthorised account activity.
      </p>

      <h2 className={prose.h2}>9. Retention</h2>
      <p className={prose.p}>
        {brand} retains personal data only for as long as reasonably necessary for the stated
        purposes, legal obligations, dispute management, accounting, security and legitimate business
        requirements. When information is no longer required, {brand} will delete, anonymise or
        otherwise dispose of it securely where reasonably practicable. An internal retention schedule
        should be maintained rather than unlimited retention.
      </p>

      <h2 className={prose.h2}>10. Overseas processing</h2>
      <p className={prose.p}>
        Some service providers may process data outside Singapore. Where personal data is transferred
        overseas, {brand} will take reasonable steps to ensure a standard of protection comparable to
        applicable Singapore data-protection requirements.
      </p>

      <h2 className={prose.h2}>11. Cookies, analytics and local storage</h2>
      <p className={prose.p}>{brand} may use cookies and local storage to:</p>
      <ul className={prose.ul}>
        <li>maintain sessions;</li>
        <li>remember preferences;</li>
        <li>preserve booking drafts;</li>
        <li>measure website performance;</li>
        <li>understand feature usage; and</li>
        <li>control PWA installation prompts.</li>
      </ul>
      <p className={prose.p}>
        A cookie notice should be provided where legally or operationally required. Non-essential
        marketing tracking should not be activated without an appropriate consent mechanism.
      </p>

      <h2 className={prose.h2}>12. Marketing communications</h2>
      <p className={prose.p}>
        Where permitted, {brand} may send service updates and marketing communications. Users may
        unsubscribe using the method provided in the message or through account preferences.
        Transactional booking and security messages may still be sent where necessary.
      </p>

      <h2 className={prose.h2}>13. Children</h2>
      <p className={prose.p}>
        {brand} is intended for users aged 18 or above. {brand} does not knowingly invite children to
        create customer or provider accounts.
      </p>

      <h2 className={prose.h2}>14. Third-party links</h2>
      <p className={prose.p}>
        {brand} may contain links to external websites. Their privacy practices are governed by their
        own policies.
      </p>

      <h2 className={prose.h2}>15. Changes to this policy</h2>
      <p className={prose.p}>
        {brand} may update this policy. Material changes will be communicated through the website,
        application or other appropriate channels. The updated effective date will be displayed on
        this page.
      </p>

      <h2 className={prose.h2}>16. Contact</h2>
      <p className={prose.p}>
        For privacy enquiries, access or correction requests, or concerns about personal-data
        handling, contact {brand} through the Support page or the configured privacy contact.
      </p>
      <LegalEntityBlock privacy />
    </article>
  )
}

export function TermsPage() {
  usePageMeta(PAGE_META.terms)
  const brand = publicTradingName()

  return (
    <article className={prose.wrap}>
      <h1 className={prose.h1}>Terms of Service</h1>
      <LegalMetaDates />
      <p className={prose.p}>
        These Terms govern access to and use of {brand}&apos;s website, progressive web application
        and related services. By creating an account, submitting a booking request or joining as a
        service provider, you agree to these Terms and the Privacy Policy.
      </p>

      <h2 className={prose.h2}>1. About {brand}</h2>
      <p className={prose.p}>
        {brand} operates a digital marketplace that helps customers request home-cleaning services
        and connect with independent cleaning service providers. Unless expressly stated otherwise,{' '}
        {brand} is not the employer of independent service providers and does not itself perform the
        cleaning service.
      </p>

      <h2 className={prose.h2}>2. Eligibility</h2>
      <p className={prose.p}>
        You must be at least 18 years old and legally capable of entering into an agreement. Service
        providers must be legally permitted to provide paid services in Singapore and must supply
        accurate registration information.
      </p>

      <h2 className={prose.h2}>3. Accounts</h2>
      <p className={prose.p}>You are responsible for:</p>
      <ul className={prose.ul}>
        <li>supplying accurate information;</li>
        <li>keeping your login credentials confidential;</li>
        <li>activities conducted through your account; and</li>
        <li>notifying {brand} of suspected unauthorised access.</li>
      </ul>
      <p className={prose.p}>
        {brand} may suspend or restrict accounts where reasonably necessary for security, fraud
        prevention, legal compliance or material breach of these Terms.
      </p>

      <h2 className={prose.h2}>4. Booking requests and confirmation</h2>
      <p className={prose.p}>
        Submitting a request does not guarantee a confirmed service. A booking becomes confirmed only
        when an eligible service provider accepts the request and {brand} displays or communicates
        the confirmed status. Customers must review service details, address, schedule, duration and
        price before submission.
      </p>

      <h2 className={prose.h2}>5. Service scope</h2>
      <p className={prose.p}>Standard home cleaning may include:</p>
      <ul className={prose.ul}>
        <li>general tidying and surface wiping;</li>
        <li>vacuuming and mopping;</li>
        <li>standard kitchen and bathroom cleaning; and</li>
        <li>bedroom and living-area cleaning.</li>
      </ul>
      <p className={prose.p}>Unless expressly agreed, standard cleaning excludes:</p>
      <ul className={prose.ul}>
        <li>hazardous materials;</li>
        <li>pest control;</li>
        <li>high-rise exterior window cleaning;</li>
        <li>heavy post-renovation debris;</li>
        <li>repair or handyman services; and</li>
        <li>illegal or unsafe activities.</li>
      </ul>

      <h2 className={prose.h2}>6. Pricing and payment</h2>
      <p className={prose.p}>
        Current standard rates are displayed before booking submission. The customer is responsible
        for the confirmed service amount, approved supplies charges, and additional hours agreed with
        the provider. No customer platform fee currently applies. {brand} may deduct a 10% service
        fee from the confirmed service amount before releasing the provider payout. Available payment
        methods are shown during booking.
      </p>

      <h2 className={prose.h2}>7. Independent service providers</h2>
      <p className={prose.p}>
        Service providers join {brand} as independent service providers unless a separate written
        employment agreement states otherwise. Providers:
      </p>
      <ul className={prose.ul}>
        <li>choose whether to accept available opportunities;</li>
        <li>are responsible for accurate profile and availability information;</li>
        <li>must provide services with reasonable care and skill;</li>
        <li>must comply with applicable laws and work-authorisation requirements;</li>
        <li>are responsible for their own tax and business obligations;</li>
        <li>must protect customer information;</li>
        <li>must not misuse booking addresses or contact details; and</li>
        <li>must report safety concerns or incidents promptly.</li>
      </ul>

      <h2 className={prose.h2}>8. Customer responsibilities</h2>
      <p className={prose.p}>Customers must:</p>
      <ul className={prose.ul}>
        <li>provide accurate booking and access information;</li>
        <li>ensure the location is reasonably safe;</li>
        <li>secure valuables and sensitive documents;</li>
        <li>disclose relevant hazards;</li>
        <li>treat providers respectfully;</li>
        <li>not request excluded or unlawful tasks; and</li>
        <li>make payment as agreed.</li>
      </ul>

      <h2 className={prose.h2}>9. Rescheduling and cancellation</h2>
      <p className={prose.p}>
        The{' '}
        <Link to="/cancellation-policy" className="font-medium text-nexo-700 hover:underline">
          Cancellation and Rescheduling Policy
        </Link>{' '}
        forms part of these Terms. Refunds and charges depend on booking status and cancellation
        timing.
      </p>

      <h2 className={prose.h2}>10. Reviews and content</h2>
      <p className={prose.p}>
        Reviews must reflect genuine completed bookings. Users must not submit unlawful, threatening,
        discriminatory, defamatory, deceptive or privacy-invasive content. {brand} may moderate
        content that breaches these Terms while preserving legitimate feedback.
      </p>

      <h2 className={prose.h2}>11. Complaints and service issues</h2>
      <p className={prose.p}>
        Customers should report service issues through {brand} support as soon as reasonably possible
        and preferably within 24 hours of the booking. Provide the booking reference, a description of
        the issue, and relevant supporting information. {brand} may facilitate communication and
        review available records but cannot guarantee a specific outcome.
      </p>

      <h2 className={prose.h2}>12. Safety and prohibited conduct</h2>
      <p className={prose.p}>Users must not:</p>
      <ul className={prose.ul}>
        <li>threaten, harass or discriminate;</li>
        <li>misuse personal information;</li>
        <li>circumvent the platform to avoid confirmed fees;</li>
        <li>submit fraudulent bookings or payment records;</li>
        <li>access another person&apos;s account;</li>
        <li>damage property intentionally;</li>
        <li>use {brand} for unlawful purposes; or</li>
        <li>interfere with platform security or operation.</li>
      </ul>

      <h2 className={prose.h2}>13. Availability and changes</h2>
      <p className={prose.p}>
        {brand} may update, suspend or discontinue features where reasonably necessary. {brand} does
        not guarantee uninterrupted availability. Planned and material disruptions should be
        communicated where practicable.
      </p>

      <h2 className={prose.h2}>14. Liability</h2>
      <p className={prose.p}>
        Nothing in these Terms excludes rights or liabilities that cannot lawfully be excluded. To
        the extent permitted by law, {brand} is not responsible for indirect or consequential loss
        arising from use of the platform. For claims directly relating to a booking, {brand}&apos;s
        aggregate liability should not exceed the amount paid for the affected booking, except where
        a greater liability is required by law.
      </p>

      <h2 className={prose.h2}>15. Indemnity</h2>
      <p className={prose.p}>
        Users may be responsible for reasonable losses or claims resulting from their fraud, unlawful
        conduct, misuse of personal data or material breach of these Terms.
      </p>

      <h2 className={prose.h2}>16. Termination</h2>
      <p className={prose.p}>
        Users may stop using {brand} and request account closure, subject to outstanding bookings,
        payments, disputes and lawful retention requirements. {brand} may suspend or terminate access
        for material breach, fraud, safety concerns or legal requirements.
      </p>

      <h2 className={prose.h2}>17. Governing law</h2>
      <p className={prose.p}>
        These Terms are governed by the laws of Singapore. The parties should first attempt to resolve
        disputes through good-faith communication. Unresolved disputes remain subject to the
        jurisdiction of the Singapore courts unless another lawful process is agreed.
      </p>

      <h2 className={prose.h2}>18. Changes to these Terms</h2>
      <p className={prose.p}>
        {brand} may update these Terms. Material changes will be communicated appropriately. Continued
        use after the effective date constitutes acceptance where legally permitted.
      </p>

      <h2 className={prose.h2}>19. Contact</h2>
      <p className={prose.p}>Contact {brand} through the Support page.</p>
      <LegalEntityBlock />
    </article>
  )
}

export function CancellationPolicyPage() {
  usePageMeta(PAGE_META.cancellation)
  const brand = publicTradingName()

  return (
    <article className={prose.wrap}>
      <h1 className={prose.h1}>Cancellation and Rescheduling Policy</h1>
      <LegalMetaDates />
      <p className={prose.p}>
        This policy applies to one-time home-cleaning bookings made through {brand}.
      </p>

      <h2 className={prose.h2}>1. Before provider acceptance</h2>
      <p className={prose.p}>
        A customer may cancel a pending request before a service provider accepts it without a
        cancellation charge. If payment has already been collected, the eligible amount will be
        refunded.
      </p>

      <h2 className={prose.h2}>2. After booking confirmation</h2>
      <p className={prose.p}>
        Once a provider accepts the request, the booking is confirmed.
      </p>
      <h3 className={prose.h3}>More than 24 hours before the scheduled start</h3>
      <ul className={prose.ul}>
        <li>No cancellation charge.</li>
        <li>Eligible payments will be refunded in full.</li>
      </ul>
      <h3 className={prose.h3}>Between 6 and 24 hours before the scheduled start</h3>
      <ul className={prose.ul}>
        <li>A cancellation charge equal to 50% of the confirmed service amount may apply.</li>
        <li>Any remaining eligible balance will be refunded.</li>
      </ul>
      <h3 className={prose.h3}>Less than 6 hours before the scheduled start</h3>
      <ul className={prose.ul}>
        <li>The confirmed service amount may be non-refundable.</li>
      </ul>

      <h2 className={prose.h2}>3. Customer no-show or access failure</h2>
      <p className={prose.p}>A booking may be treated as a customer no-show where:</p>
      <ul className={prose.ul}>
        <li>the provider arrives at the correct address and time;</li>
        <li>the provider cannot obtain access;</li>
        <li>the customer cannot be contacted after reasonable attempts; and</li>
        <li>the provider waits for the documented grace period.</li>
      </ul>
      <p className={prose.p}>
        A 20-minute grace period applies unless the business approves another duration. A customer
        no-show may be non-refundable. Providers must record arrival and contact attempts through the
        platform before no-show treatment applies.
      </p>

      <h2 className={prose.h2}>4. Provider cancellation or no-show</h2>
      <p className={prose.p}>
        If the assigned provider cancels and {brand} cannot arrange a suitable replacement accepted
        by the customer, the customer may reschedule without charge or receive a full refund of the
        eligible booking payment. Provider cancellations must not create a charge for the customer.
      </p>

      <h2 className={prose.h2}>5. Rescheduling</h2>
      <h3 className={prose.h3}>More than 24 hours before the scheduled start</h3>
      <p className={prose.p}>
        Customers may request one reschedule without charge, subject to provider availability.
      </p>
      <h3 className={prose.h3}>Within 24 hours</h3>
      <p className={prose.p}>
        A rescheduling request may be treated as a cancellation and new booking under the applicable
        timing rule. A reschedule is not confirmed until the provider or {brand} confirms the new date
        and time.
      </p>

      <h2 className={prose.h2}>6. Service issues</h2>
      <p className={prose.p}>
        Customers should report service-quality concerns as soon as reasonably possible and preferably
        within 24 hours after the booking. {brand} may review booking records, messages, timestamps,
        supporting photographs where voluntarily supplied, and information from the customer and
        provider. {brand} may facilitate an appropriate remedy, but a specific refund or repeat
        service is not automatically guaranteed.
      </p>

      <h2 className={prose.h2}>7. Refund timing</h2>
      <p className={prose.p}>
        Approved refunds will be returned through an available method appropriate to the original
        payment. Processing may take up to 10 business days depending on the payment method and
        financial institution.
      </p>

      <h2 className={prose.h2}>8. Exceptional circumstances</h2>
      <p className={prose.p}>
        {brand} may consider reasonable exceptions for emergencies, severe weather, building-access
        restrictions, safety incidents or other circumstances outside a user&apos;s reasonable
        control. Supporting information may be requested where appropriate.
      </p>

      <h2 className={prose.h2}>9. Policy abuse</h2>
      <p className={prose.p}>
        {brand} may restrict accounts involved in repeated fraudulent bookings, false no-show claims,
        payment abuse or manipulation of the cancellation process.
      </p>

      <h2 className={prose.h2}>10. Contact</h2>
      <p className={prose.p}>To cancel, reschedule or report a problem:</p>
      <ul className={prose.ul}>
        <li>use the booking-management function where available; or</li>
        <li>
          contact {brand} through{' '}
          <Link to="/support" className="font-medium text-nexo-700 hover:underline">
            Support
          </Link>{' '}
          and include the booking reference.
        </li>
      </ul>
      <LegalEntityBlock />
    </article>
  )
}
