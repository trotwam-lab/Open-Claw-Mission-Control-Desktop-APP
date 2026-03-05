#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="${ROOT_DIR}/dist"
VERSION="$(cat "${ROOT_DIR}/VERSION")"
ARTIFACT_BASE="open-claw-mission-control-${VERSION}"
STAGE_DIR="${DIST_DIR}/${ARTIFACT_BASE}"
ZIP_PATH="${DIST_DIR}/${ARTIFACT_BASE}.zip"
CHECKSUM_PATH="${DIST_DIR}/${ARTIFACT_BASE}.sha256"

rm -rf "${STAGE_DIR}" "${ZIP_PATH}" "${CHECKSUM_PATH}"
mkdir -p "${STAGE_DIR}"

cp "${ROOT_DIR}/index.html" "${STAGE_DIR}/"
cp "${ROOT_DIR}/styles.css" "${STAGE_DIR}/"
cp "${ROOT_DIR}/app.js" "${STAGE_DIR}/"
cp "${ROOT_DIR}/README.md" "${STAGE_DIR}/"
cp "${ROOT_DIR}/VERSION" "${STAGE_DIR}/"

cat > "${STAGE_DIR}/RELEASE_NOTES.txt" <<NOTES
Open Claw Mission Control Desktop App
Version: ${VERSION}

Contents:
- index.html
- styles.css
- app.js
- README.md
- VERSION

Run locally:
1) python3 -m http.server 4173
2) Open http://127.0.0.1:4173
NOTES

(
  cd "${DIST_DIR}"
  zip -r "${ARTIFACT_BASE}.zip" "${ARTIFACT_BASE}" >/dev/null
)

if command -v sha256sum >/dev/null 2>&1; then
  (cd "${DIST_DIR}" && sha256sum "${ARTIFACT_BASE}.zip" > "${ARTIFACT_BASE}.sha256")
elif command -v shasum >/dev/null 2>&1; then
  (cd "${DIST_DIR}" && shasum -a 256 "${ARTIFACT_BASE}.zip" > "${ARTIFACT_BASE}.sha256")
else
  echo "No checksum tool found; skipping checksum generation." >&2
fi

echo "Release artifact created: ${ZIP_PATH}"
[ -f "${CHECKSUM_PATH}" ] && echo "Checksum file created: ${CHECKSUM_PATH}"
