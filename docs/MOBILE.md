# Nexo mobile apps (iOS & Android)

Nexo ships as a **Capacitor** app: the same React web app is packaged into native iOS and Android shells for App Store and Google Play.

| Item | Value |
|------|--------|
| App name | Nexo |
| Bundle / Application ID | `online.nexoservice.app` |
| Web source | `dist/` (Vite production build) |
| iOS project | `ios/` |
| Android project | `android/` |

## Prerequisites

### Shared
- Node.js 20+
- This repo with `.env` containing production `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### iOS (Mac only)
- [Xcode](https://developer.apple.com/xcode/) (latest stable)
- [Apple Developer Program](https://developer.apple.com/programs/) ($99/year)
- CocoaPods is optional (Capacitor 8 uses Swift Package Manager)

### Android
- [Android Studio](https://developer.android.com/studio) (latest stable)
- JDK 17+
- [Google Play Console](https://play.google.com/console) developer account ($25 one-time)

## Daily build workflow

```bash
# 1. Build the web app and copy into native projects
npm run mobile:build

# 2. Open in the native IDE
npm run mobile:ios       # opens Xcode
npm run mobile:android   # opens Android Studio
```

After any web/UI change, run `npm run mobile:build` again before testing on device.

## Icons & splash

Source images live in `resources/`:

- `icon.png` — 1024×1024 preferred (currently uses `pwa-icon-512.png`)
- `splash.png` / `splash-dark.png`

Generate native icons (optional, needs `@capacitor/assets`):

```bash
npm run mobile:icons
npm run mobile:sync
```

For store submission, replace `resources/icon.png` with a **1024×1024** App Store icon (no transparency, no rounded corners — Apple applies the mask).

## iOS → App Store

1. Open Xcode: `npm run mobile:ios`
2. Select the **App** target → **Signing & Capabilities**
   - Team: your Apple Developer team
   - Bundle ID: `online.nexoservice.app` (must match App Store Connect)
3. Set version: Marketing Version `1.0.0`, Build `1` (bump build for every upload)
4. Device: **Any iOS Device (arm64)** → Product → **Archive**
5. Organizer → **Distribute App** → App Store Connect
6. In [App Store Connect](https://appstoreconnect.apple.com):
   - Create the app with bundle ID `online.nexoservice.app`
   - Add screenshots (iPhone 6.7" and 6.1" minimum)
   - Privacy Policy URL (e.g. `https://nexoservice.online/privacy`)
   - Age rating, category (Lifestyle / Utilities)
   - Submit for review

### iOS privacy notes
- Camera / photo library: only if users upload booking photos — declare usage strings in `Info.plist` when you enable those APIs
- Location: not required for Phase 1 unless you add maps

## Android → Google Play

1. Open Android Studio: `npm run mobile:android`
2. Let Gradle sync finish (install SDK / JDK if prompted)
3. **Build → Generate Signed Bundle / APK** → **Android App Bundle (.aab)**
4. Create an upload keystore (keep it safe — losing it blocks updates):

```bash
keytool -genkey -v -keystore nexo-upload.keystore -alias nexo \
  -keyalg RSA -keysize 2048 -validity 10000
```

5. Upload the `.aab` in Play Console → Production (or Internal testing first)
6. Complete store listing:
   - Short / full description
   - Screenshots (phone + 7" tablet optional)
   - Feature graphic 1024×500
   - Privacy policy URL
   - Content rating questionnaire
   - Target audience / Data safety form

`versionCode` / `versionName` are in `android/app/build.gradle` (currently `1` / `1.0`). Increment `versionCode` for every Play upload.

## Store review tips (important)

Apple and Google may reject thin “website wrappers.” This project is stronger because:

- Full booking / auth / PayNow flows run in-app
- Native status bar, splash, and Android back button are wired
- Offline shell loads bundled assets (not a remote URL only)

Still prepare:

- Demo login for reviewers (customer + provider)
- Notes explaining PayNow is Singapore-specific
- Working privacy policy and support contact

## What this does *not* automate

| Step | Owner |
|------|--------|
| Apple Developer / Play Console enrollment | You |
| Signing certificates & upload keystore | You |
| Store screenshots & listing copy | You |
| App Review / Play review submission | You |
| Push notifications (FCM / APNs) | Future work |

## Troubleshooting

**White screen on device**  
Run `npm run mobile:build` so `dist/` is synced. Confirm `.env` values were present during `vite build`.

**Android “Unable to locate Java Runtime”**  
Install JDK 17 and set `JAVA_HOME`, or open the project once in Android Studio so it configures the SDK.

**Auth redirects**  
Add the Capacitor app origins / deep link scheme in Supabase Auth redirect URLs if magic links are used. Prefer in-app email+password (already supported).

**CORS / API**  
Supabase calls use the anon key from the build; no extra CORS for Capacitor `https` scheme when using the official JS client.
