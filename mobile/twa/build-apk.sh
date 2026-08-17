#!/usr/bin/env bash
set -x
cd /home/user/Wellspire-/mobile/twa
export CI=false
# 1) Non-interactive keystore for TEST signing only.
#    NOT for the Play Store — Google requires YOUR OWN upload key, kept forever.
#    Override the throwaway test password with:  KS_PASS=... ./build-apk.sh
KS_PASS="${KS_PASS:-changeit-test}"
keytool -genkeypair -dname "CN=Wellspire International School, O=Wellspire, L=Hyderabad, C=IN" \
  -alias android -keystore android.keystore -storepass "$KS_PASS" -keypass "$KS_PASS" \
  -keyalg RSA -keysize 2048 -validity 10000 2>&1 | tail -2
# 2) Let bubblewrap auto-install JDK + Android SDK, init from the live manifest,
#    accepting defaults (the web manifest supplies name/colors/icons).
yes '' | bubblewrap init --manifest https://wellspire-sms.onrender.com/manifest.webmanifest --directory . 2>&1
# 3) Build (skip PWA validation to avoid network round-trips blocking the build)
yes '' | bubblewrap build --skipPwaValidation 2>&1
echo "=== ARTIFACTS ==="
ls -la *.apk *.aab 2>/dev/null || echo "no apk/aab produced"
