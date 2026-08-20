# Publishing Wellspire to the Google Play Store

The Wellspire portal is a PWA (installable web app). The Play Store version is a
thin **TWA** (Trusted Web Activity) — a tiny Android app that opens the live
site full-screen, with no browser chrome. Users get a real Play Store listing
and an installable app; you maintain only one codebase (the web app).

Everything below runs on your machine once. You need:

- **Node 18+** and a **JDK 17** (for the build).
- A **Google Play Console** account (one-time US$25): <https://play.google.com/console>
- The live site already deployed (it is): <https://wellspire-sms.onrender.com>

---

## 1. Install Bubblewrap

```bash
npm i -g @bubblewrap/cli
```

Bubblewrap downloads the Android SDK + JDK on first run if you don't have them
(answer "yes" when prompted).

## 2. Generate the Android project

From the repo root:

```bash
cd mobile/twa
bubblewrap init --manifest https://wellspire-sms.onrender.com/manifest.webmanifest
```

A pre-filled `twa-manifest.json` is already in this folder (package
`com.wellspire.school`, brand colors, home-screen shortcuts). Accept its values,
or let `init` read them from the manifest URL.

When prompted about the **signing key**, let Bubblewrap create one. It writes
`android.keystore` + passwords.

> ⚠️ **Keep `android.keystore` and its passwords forever.** Google Play requires
> the *same* key to sign every future update. Losing it means you can't update
> the app. Do **not** commit it (this folder is git-ignored for keystores).

## 3. Build the app bundle

```bash
bubblewrap build
```

This produces:

- `app-release-signed.aab` → upload this to the Play Store.
- `app-release-signed.apk` → for sideloading / testing on a device.

## 4. Verify the domain (removes the URL bar)

Get your app's signing fingerprint:

```bash
bubblewrap fingerprint list      # copy the SHA-256
```

Then make the site vouch for the app. Two options:

- **Env (no redeploy of code):** in Render → the `wellspire-sms` service →
  Environment, add `ANDROID_ASSETLINKS` set to the JSON below (one line), then
  redeploy.
- **File:** edit `server/public/assetlinks.json`, replace the placeholder
  fingerprint, commit, and deploy.

```json
[{"relation":["delegate_permission/common.handle_all_urls"],
  "target":{"namespace":"android_app","package_name":"com.wellspire.school",
  "sha256_cert_fingerprints":["YOUR_SHA256_HERE"]}}]
```

Confirm it's served: <https://wellspire-sms.onrender.com/.well-known/assetlinks.json>

## 5. Publish

1. Play Console → **Create app** → fill listing (name "Wellspire School",
   category Education, the 512×512 icon at `/icon-512.png`, screenshots).
2. **Production → Create release** → upload `app-release-signed.aab`.
3. Complete the content-rating + data-safety questionnaires, then roll out.

Review usually takes a few days. After that, "Wellspire School" is installable
from the Play Store, and every web deploy updates the app instantly — no new
Play submission needed for content/feature changes (only for package-level
changes like the app name or icon).

---

## iOS / App Store

Apple doesn't accept pure TWAs. Options:
- **PWA install** works today on iOS (Safari → Share → *Add to Home Screen*).
- For a real App Store listing, wrap the same URL with **PWABuilder**
  (<https://www.pwabuilder.com>) → *iOS package*, then submit via an Apple
  Developer account (US$99/yr) and Xcode. The web app needs no changes.
