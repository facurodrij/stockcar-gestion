#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="${ROOT_DIR}/server"
CLIENT_DIR="${ROOT_DIR}/client"
VENV_PYTHON="${ROOT_DIR}/.venv/bin/python"

if [ ! -x "${VENV_PYTHON}" ]; then
  echo "No se encontró Python del entorno virtual en ${ROOT_DIR}/.venv/bin/python"
  echo "Crea/activa el venv y reinstala dependencias antes de continuar."
  exit 1
fi

# Variables base del backend
SERVER_ENV_FILE="${SERVER_DIR}/.env"
if [ -f "${SERVER_ENV_FILE}" ]; then
  set -a
  source "${SERVER_ENV_FILE}"
  set +a
fi

export FLASK_APP="${FLASK_APP:-wsgi:app}"
export FLASK_RUN_HOST="${FLASK_RUN_HOST:-${BACKEND_HOST:-0.0.0.0}}"
export FLASK_RUN_PORT="${FLASK_RUN_PORT:-${BACKEND_PORT:-5000}}"
export BACKEND_HOST="${FLASK_RUN_HOST}"
export BACKEND_PORT="${FLASK_RUN_PORT}"

# Detectar IP pública (fallback automático a IP local si falla)
PUBLIC_IP="${PUBLIC_IP:-}"
if [ -z "${PUBLIC_IP}" ] && command -v curl >/dev/null 2>&1; then
  PUBLIC_IP="$(curl -fsSL --max-time 5 https://api.ipify.org || true)"
fi
if [ -z "${PUBLIC_IP}" ]; then
  PUBLIC_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
fi
if [ -z "${PUBLIC_IP}" ]; then
  PUBLIC_IP="${BACKEND_HOST}"
fi

# Variables para React en este entorno
export HOST="${REACT_HOST:-0.0.0.0}"
export PORT="${FRONTEND_PORT:-3000}"
export REACT_APP_API_URL="${REACT_APP_API_URL:-http://$PUBLIC_IP:${BACKEND_PORT}}"
export DANGEROUSLY_DISABLE_HOST_CHECK=true

echo "Backend: http://${FLASK_RUN_HOST}:${FLASK_RUN_PORT}"
echo "Frontend: http://${HOST}:${PORT}"
echo "API URL:  ${REACT_APP_API_URL}"

(
  cd "${SERVER_DIR}"
  "${VENV_PYTHON}" -m flask run --host "${FLASK_RUN_HOST}" --port "${FLASK_RUN_PORT}"
) &
BACK_PID=$!

(
  cd "${CLIENT_DIR}"
  npm start -- --host "${HOST}" --port "${PORT}"
) &
FRONT_PID=$!

cleanup() {
  echo "\nCerrando procesos..."
  kill "${BACK_PID}" "${FRONT_PID}" 2>/dev/null || true
  exit 0
}
trap cleanup INT TERM

wait
