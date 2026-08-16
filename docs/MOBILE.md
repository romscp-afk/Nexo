# Nexo Mobile App

Nexo runs as a **Progressive Web App (PWA)** — users can install it on their phone like a native app without the App Store.

## For users

### iPhone (Safari)
1. Open [nexo-service-sepia.vercel.app](https://nexo-service-sepia.vercel.app)
2. Tap **Share** → **Add to Home Screen**
3. Open Nexo from your home screen

### Android (Chrome)
1. Open the site in Chrome
2. Tap **Install app** when prompted, or Menu → **Install app**

## Mobile UX

- **Bottom tab bar** — Services, Book, Bookings, Messages, Profile (logged-in customers)
- **Hamburger menu** — public pages on small screens
- **Sticky booking button** — total price + submit stays visible while scrolling booking forms
- **Safe area support** — works on notched iPhones

## For developers

```bash
npm run dev          # test on phone via LAN (vite host: true)
npm run build        # includes service worker + manifest
```

PWA config: `vite.config.ts` (`vite-plugin-pwa`).

### App Store later (optional)

If you need iOS/Android store listings, wrap the same build with [Capacitor](https://capacitorjs.com/):

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap init Nexo com.nexo.app
npx cap add ios && npx cap add android
npm run build && npx cap sync
```

No code rewrite required — same React app inside a native shell.
