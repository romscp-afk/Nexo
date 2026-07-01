/** Curated Nexo platform knowledge for the AI assistant system prompt & offline fallback. */

export const NEXO_ASSISTANT_KNOWLEDGE = `
Nexo is a Singapore home services marketplace (cleaning, handyman, movers, aircon, plumbing).

## How to book
- Browse Services → pick a category → "Request [category]" broadcasts to ALL providers in that category.
- Or browse Providers → pick one → book directly.
- Choose PayNow (pay platform in advance) or Cash (pay provider on completion).

## PayNow flow (+6587877525)
1. Provider accepts/confirms booking.
2. Customer scans PayNow QR on booking detail page (amount + reference e.g. NEXO-B2222222).
3. Customer clicks "I have paid via PayNow".
4. Admin confirms payment in Admin → PayNow payments.
5. Provider can start the job.

## Cash flow
1. Customer selects Cash when booking — highlighted in amber for admin & providers.
2. Provider accepts the open request.
3. Provider pays $25 admin fee to platform via PayNow QR on booking page.
4. Admin confirms → provider receives receipt + customer contact details.
5. Customer pays provider in cash when job is done.
6. Provider marks service complete → customer gets receipt.

## Roles
- Customer: /dashboard — bookings, reviews, notifications, profile.
- Provider: /provider — open category requests, assigned jobs, profile/pricing.
- Admin: /admin — payments, activity log, users, providers, bookings.

## Demo accounts
- customer.demo@nexo.sg — customer (Demo1234!)
- cleanpro@nexo.sg, provider.demo@nexo.sg — providers (Demo1234!)
- romalgk@gmail.com — admin portal (Test@123)

## Open requests
When customer requests without picking a provider, all providers offering that service get notified. First to accept gets the job.

## Receipts
- Customer receipt: issued when provider marks job completed.
- Provider receipt: issued when admin confirms admin fee (cash jobs).

## SQL setup (Supabase SQL Editor)
schema.sql → seed.sql → fix-auth-trigger.sql → add-payments.sql → add-marketplace.sql → seed-admin.sql → seed-demo.sql
`.trim()

export type FaqEntry = {
  id: string
  keywords: string[]
  answer: string
}

export const ASSISTANT_FAQ: FaqEntry[] = [
  {
    id: 'book',
    keywords: ['book', 'booking', 'request', 'schedule', 'how do i', 'get service'],
    answer:
      'To book: go to Services → choose a category (e.g. Cleaning) → Request cleaning to alert all providers in that category, or go to Providers to pick someone specific. Fill in date, address, and choose PayNow or Cash.',
  },
  {
    id: 'paynow',
    keywords: ['paynow', 'pay now', 'qr', 'payment', 'advance', '6587877525'],
    answer:
      'PayNow: After a provider accepts your booking, open the booking detail page. Scan the QR and pay to +6587877525 using the reference shown (e.g. NEXO-B2222222). Click "I have paid via PayNow". Admin verifies, then the provider starts your job.',
  },
  {
    id: 'cash',
    keywords: ['cash', 'pay cash', 'admin fee', '25'],
    answer:
      'Cash: Select Cash when booking (amber highlight). You pay the provider in person when the job is done. The provider pays a $25 admin fee to Nexo via PayNow. After admin confirms, the provider gets your contact details and can start.',
  },
  {
    id: 'provider',
    keywords: ['provider', 'accept', 'open request', 'job', 'become provider', 'register provider'],
    answer:
      'Providers: Register as a provider, set services and areas in Profile. Check Open requests for category-wide jobs. PayNow jobs need customer payment confirmed; cash jobs need your admin fee confirmed before starting.',
  },
  {
    id: 'admin',
    keywords: ['admin', 'confirm payment', 'activity log', 'portal'],
    answer:
      'Admin (romalgk@gmail.com / Test@123): Use PayNow payments to confirm transfers. Activity log shows all actions. Cash bookings are highlighted in amber.',
  },
  {
    id: 'demo',
    keywords: ['demo', 'login', 'password', 'test account', 'sample'],
    answer:
      'Demo: customer.demo@nexo.sg / cleanpro@nexo.sg / provider.demo@nexo.sg — password Demo1234!\nAdmin: romalgk@gmail.com — password Test@123\nUse quick-fill on the Login page.',
  },
  {
    id: 'receipt',
    keywords: ['receipt', 'invoice', 'proof'],
    answer:
      'Receipts appear on the booking detail page. Customers get one when the provider marks the job done. Providers get one when admin confirms the admin fee on cash jobs.',
  },
  {
    id: 'cancel',
    keywords: ['cancel', 'cancellation'],
    answer:
      'Customers can cancel while a booking is still pending (before a provider accepts). Open the booking and use Cancel request.',
  },
  {
    id: 'services',
    keywords: ['service', 'cleaning', 'aircon', 'plumbing', 'handyman', 'mover', 'category'],
    answer:
      'Nexo offers: Home Cleaning, Handyman, Movers, Aircon Service, and Plumbing. Browse them under Services in the menu.',
  },
  {
    id: 'contact',
    keywords: ['contact', 'support', 'help', 'phone'],
    answer:
      'PayNow platform number: +6587877525. Check Notifications and your booking timeline for status updates. Admins monitor payments in the admin portal.',
  },
]

export const SUGGESTED_QUESTIONS = [
  'How do I book a cleaning service?',
  'PayNow vs Cash — what is the difference?',
  'How do providers accept open requests?',
  'What are the demo login accounts?',
  'When do I get a receipt?',
]
