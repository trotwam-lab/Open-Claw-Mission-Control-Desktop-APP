#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INSTALL_DIR="${HOME}/.local/share/open-claw-mission-control"
BIN_DIR="${HOME}/.local/bin"
LAUNCHER="${BIN_DIR}/openclaw-mission-control"

mkdir -p "${INSTALL_DIR}" "${BIN_DIR}"

cp "${ROOT_DIR}/index.html" "${INSTALL_DIR}/index.html"
cp "${ROOT_DIR}/styles.css" "${INSTALL_DIR}/styles.css"
cp "${ROOT_DIR}/app.js" "${INSTALL_DIR}/app.js"
cp "${ROOT_DIR}/VERSION" "${INSTALL_DIR}/VERSION"

cat > "${LAUNCHER}" <<LAUNCH
#!/usr/bin/env bash
set -euo pipefail
APP_DIR="${INSTALL_DIR}"
cd "\${APP_DIR}"

if command -v python3 >/dev/null 2>&1; then
  PORT=4173
  python3 -m http.server "\${PORT}" --bind 127.0.0.1 >/tmp/openclaw-mc-server.log 2>&1 &
  SERVER_PID=\$!
  trap 'kill \${SERVER_PID} >/dev/null 2>&1 || true' EXIT
  sleep 0.6
fi

if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "http://127.0.0.1:4173"
elif command -v open >/dev/null 2>&1; then
  open "http://127.0.0.1:4173"
else
  echo "Open this URL in your browser: http://127.0.0.1:4173"
fi

wait \${SERVER_PID:-0} 2>/dev/null || true
LAUNCH

chmod +x "${LAUNCHER}"

echo "Installed Open Claw Mission Control to ${INSTALL_DIR}"
echo "Launcher created at ${LAUNCHER}"
echo "Run with: openclaw-mission-control"
