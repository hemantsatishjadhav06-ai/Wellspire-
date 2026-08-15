# Wellspire — Mobile App (PWA → Play Store & App Store)

Wellspire ships as an **installable Progressive Web App (PWA)**. Parents, teachers
and staff can install it to their home screen straight from the browser, and you
can **wrap the same PWA** into native packages for the **Google Play Store** and
the **Apple App Store** — no separate mobile codebase.

This guide covers, in order:

1. [What a PWA is](#1-what-a-pwa-is)
2. [Installing it (Android & iOS)](#2-installing-the-pwa)
3. [How the PWA is wired here](#3-how-the-pwa-is-wired-in-this-repo) — manifest + service worker
4. [Required assets](#4-required-assets-icons--splash)
5. [Publish to Android (Bubblewrap / TWA, PWABuilder)](#5-android--google-play-store)
6. [Publish to iOS (PWABuilder / Capacitor)](#6-ios--apple-app-store)
7. [Store review notes](#7-store-review-notes)

---

## 1. What a PWA is

A **Progressive Web App** is a normal website that behaves like a native app:

- **Installable** — the browser offers "Add to Home Screen"; once installed it
  launches full-screen (no address bar) from its own icon.
- **Offline-capable** — a **service worker** caches the app shell so it still
  opens without a connection.
- **Native-feeling** — a **web app manifest** gives it a name, icon, theme colour,
  splash screen and standalone display mode.

Because it's just the web app, there is **one codebase** and **one deployment** —
updates ship instantly on next load, no app-store release needed for content
changes.

---

## 2. Installing the PWA

The app is served over HTTPS (a hard requirement for PWAs) from your deployment.

### Android (Chrome / Edge)
1. Open the app URL in Chrome.
2. Chrome shows an **"Install app" / "Add to Home screen"** prompt, or use
   **⋮ menu → Install app**.
3. The Wellspire icon lands on the home screen and launches standalone.

> In this app, Chromium's install prompt is captured (`beforeinstallprompt`) and
> can be re-triggered from an in-app "Add to home screen" button.

### iOS / iPadOS (Safari)
Apple does **not** fire an install prompt, so it's a manual Safari flow:
1. Open the app URL in **Safari** (not Chrome — only Safari can install PWAs on
   iOS).
2. Tap the **Share** icon → **Add to Home Screen** → **Add**.
3. Launch from the new icon; it runs full-screen.

> The app detects iOS Safari and shows manual "Share → Add to Home Screen"
> instructions there instead of a prompt button.

### Desktop
Chrome/Edge show an install icon in the address bar; installing gives a windowed
app with its own icon.

---

## 3. How the PWA is wired in this repo

Three files under `web/public/` (served at the site root) plus one registration
helper make the app a PWA.

### `manifest.webmanifest`
Linked from the app and describing how it installs:

```json
{
  "name": "Wellspire School",
  "short_name": "Wellspire",
  "description": "School management for admins, teachers, parents and students",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#ffffff",
  "theme_color": "#233F88",
  "categories": ["education", "productivity"],
  "icons": [
    { "src": "/icon.svg",     "sizes": "any",     "type": "image/svg+xml", "purpose": "any maskable" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png",     "purpose": "any" }
  ]
}
```

Key fields:
- **`display: standalone`** — no browser chrome; looks like a native app.
- **`start_url` / `scope`** — the app opens at `/` and controls the whole origin.
- **`theme_color: #233F88`** — the brand navy used for the status/title bar.
- **icons** — a scalable maskable SVG (`/icon.svg`) plus a 512×512 PNG. Add a
  192×192 PNG as well for the widest device coverage (see §4).

### `sw.js` — the service worker
A minimal, SPA-safe worker (cache name `wellspire-v1`):
- **Network-first** for navigations and `/api/*` requests — always fresh when
  online, falling back to the **cached app shell** (`/`, `/index.html`) when
  offline so the SPA still boots.
- **Cache-first** for other same-origin GET assets (JS/CSS/images).
- Cross-origin and non-GET requests pass straight through. All offline logic is
  wrapped defensively so a cache failure can never break the running app.

### `registerPwa.js` — registration + install prompt
- Registers `/sw.js` **in production builds only** (`import.meta.env.PROD`).
- Captures `beforeinstallprompt` so the UI can offer install on a user gesture;
  exposes helpers: `promptInstall()` (`accepted`/`dismissed`/`unavailable`),
  `canInstall()`, `isIosSafari()`, `isStandalone()`.

> **HTTPS is mandatory.** Service workers and installability only work over
> `https://` (or `http://localhost` in dev). Your production deployment already
> serves HTTPS.

---

## 4. Required assets (icons & splash)

Have these ready before wrapping for the stores. Keep them in `web/public/`.

| Asset | Size | Notes |
| --- | --- | --- |
| Maskable/scalable icon | `icon.svg` (any) | Full-bleed background inside the maskable safe zone — already present. |
| PNG icon | **512×512** (`icon-512.png`) | Referenced by the manifest; **generate this PNG** if missing. |
| PNG icon | **192×192** (`icon-192.png`) | Recommended; add an entry to the manifest. |
| Apple touch icon | **180×180** | `<link rel="apple-touch-icon" href="/apple-touch-icon.png">` for iOS home-screen. |
| Play Store icon | **512×512** PNG | Store listing (separate from launcher icon). |
| Feature graphic (Play) | **1024×500** PNG/JPG | Required for the Play listing. |
| App Store icon | **1024×1024** PNG, no alpha | Required by App Store Connect. |
| Splash screens | per-device | Bubblewrap/Capacitor generate these from your icon + colours. |
| Screenshots | phone + tablet | Both stores require store screenshots. |

**Maskable icons matter.** Android masks launcher icons into circles/squircles —
keep the logo within the centre ~80% "safe zone" (the shipped `icon.svg` already
does this with a full-bleed navy field).

Tooling that generates the full icon/splash set from one source image:
`pwa-asset-generator`, **PWABuilder** (§5/§6), or the Bubblewrap/Capacitor CLIs.

---

## 5. Android — Google Play Store

The Play Store accepts a PWA wrapped as a **Trusted Web Activity (TWA)** — a
native shell that renders your live PWA full-screen with no browser UI. Two ways
to build it.

### Prerequisites
- A published PWA on HTTPS with a valid manifest + service worker (done — §3).
- **Node 16+** and a **JDK** (for Bubblewrap; it can install Android SDK bits).
- A **Google Play Developer account** (one-time $25 fee).

### Option A — Bubblewrap CLI (`@bubblewrap/cli`)

```bash
# 1. Install the CLI
npm install -g @bubblewrap/cli

# 2. Initialise a TWA project from your live manifest
bubblewrap init --manifest https://YOUR-DOMAIN/manifest.webmanifest
#   Answer the prompts: app name, package id (e.g. school.wellspire.app),
#   launcher icon, theme/nav colours, signing-key details.

# 3. Build the signed app bundle (and APK)
bubblewrap build
#   Produces app-release-bundle.aab (upload this to Play) + a signing keystore.
```

**Digital Asset Links — required so the TWA opens without a browser bar.**
Bubblewrap prints the signing key's SHA-256 fingerprint. Publish an
`assetlinks.json` at **`https://YOUR-DOMAIN/.well-known/assetlinks.json`**:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "school.wellspire.app",
    "sha256_cert_fingerprints": ["AB:CD:EF:...:the-fingerprint-from-bubblewrap"]
  }
}]
```

> If you enable **Play App Signing** (recommended), also add the SHA-256 that
> Google shows in Play Console → *Setup → App integrity* to the fingerprints
> array — otherwise the app launches with a URL bar. Verify with Google's
> Statement List Tester.

Then: **Play Console → Create app → Production → upload the `.aab`**, fill the
store listing (icon 512×512, feature graphic 1024×500, screenshots, description,
privacy policy URL), and submit for review.

### Option B — PWABuilder (no local Android tooling)
1. Go to **[pwabuilder.com](https://www.pwabuilder.com)** and enter your app URL.
2. It audits the manifest/service worker and scores installability.
3. **Package for Android** → downloads a TWA `.aab` **plus a ready-made
   `assetlinks.json`**. Host that `assetlinks.json` at `/.well-known/` as above,
   then upload the `.aab` to Play Console.

---

## 6. iOS — Apple App Store

Apple does not accept a bare PWA upload; you wrap it in a native shell (a
`WKWebView` app) and submit that.

### Prerequisites
- A **paid Apple Developer account** ($99/year).
- A **Mac with Xcode** installed (required to build, sign and upload iOS apps).
- Your live HTTPS PWA (§3).

### Option A — PWABuilder (fastest)
1. On **[pwabuilder.com](https://www.pwabuilder.com)**, enter your app URL →
   **Package for iOS**.
2. Download the generated **Xcode project** (a Swift `WKWebView` wrapper around
   your PWA).
3. Open it in **Xcode**, set the **Bundle Identifier** (e.g.
   `school.wellspire.app`) and your **Team** (Signing & Capabilities →
   automatic signing).
4. Add the **1024×1024** app icon and launch screen; set version/build numbers.
5. **Product → Archive → Distribute App → App Store Connect** to upload.

### Option B — Capacitor (more control / native plugins)

```bash
# In the web app
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap init "Wellspire" school.wellspire.app --web-dir=dist

npm run build          # produce web/dist
npx cap add ios
npx cap copy ios       # copy the built web assets into the iOS project
npx cap open ios       # opens Xcode
```

Capacitor loads your built app (or points a live URL) inside a native iOS shell
and lets you add native plugins (push, camera, geolocation) later. In Xcode: set
the bundle id + Team, add the **1024×1024** icon, then **Archive → Distribute** to
App Store Connect.

> **App Store Connect** listing needs: app name, bundle id, **1024×1024** icon
> (no alpha/transparency), screenshots for required device sizes, description,
> keywords, support & privacy-policy URLs, and an **App Privacy** questionnaire.

### Signing (both platforms, summary)
- **Android:** an **upload keystore** (Bubblewrap creates one; keep it safe) +
  **Play App Signing** managed by Google. The keystore's SHA-256 must be in
  `assetlinks.json`.
- **iOS:** an Apple **Distribution certificate** + **provisioning profile**, tied
  to your Team and bundle id. Xcode's *automatic signing* handles this once you're
  signed into your Developer account.

---

## 7. Store review notes

Wrapping a website triggers extra scrutiny — plan for these:

- **No "thin wrapper" rejections (Apple 4.2).** A pure web-in-a-box can be
  rejected as "not app-like." Because Wellspire is a rich, standalone product
  (dashboards, forms, offline shell, native-feeling navigation) this is normally
  fine; leaning on installed-PWA features (offline, home-screen, push) strengthens
  the case. Provide **demo/reviewer credentials** for a school account since the
  app is behind login.
- **Login walls.** Both stores require reviewers to reach the functionality —
  supply a working test account (a demo-mode role or a seeded Supabase user).
- **Privacy policy is mandatory** for both stores. Fill Apple's **App Privacy**
  labels and Google's **Data safety** form accurately (what data is collected:
  names, contact info, student records, location for bus tracking).
- **Permissions.** If you enable camera (facilities photos) or geolocation
  (transport), declare them and explain the use in the listing and in the OS
  permission prompt strings.
- **TWA URL bar.** If `assetlinks.json` is wrong or unhosted, the Android app
  shows a Chrome URL bar — verify Digital Asset Links before submitting.
- **Content updates ship instantly.** Because the store apps load your live PWA,
  content and feature changes go out on next launch — you only need a new store
  release when you change the **native shell, icons, permissions or store
  metadata**.
- **Versioning.** Bump `versionCode`/`versionName` (Android) and build/marketing
  version (iOS) on every store upload.

---

*See also: [`FEATURES.md`](./FEATURES.md) for what the app does, and
[`SUPABASE.md`](./SUPABASE.md) to connect persistent data before you publish.*
