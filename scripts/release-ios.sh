#!/usr/bin/env bash
# Local iOS build + TestFlight upload with fastlane (no EAS).
# Needs ASC_KEY_ID, ASC_ISSUER_ID, APPLE_TEAM_ID exported (zshrc); key at ~/.appstoreconnect/private_keys.
set -euo pipefail
cd "$(dirname "$0")/.."
export ASC_KEY_PATH="${ASC_KEY_PATH:-$HOME/.appstoreconnect/private_keys/AuthKey_${ASC_KEY_ID:?}.p8}"
export EXPO_PUBLIC_API_URL="https://gym-track-api.bryalv77.workers.dev"
rm -f build-*.ipa
npx expo prebuild -p ios --clean
fastlane beta
