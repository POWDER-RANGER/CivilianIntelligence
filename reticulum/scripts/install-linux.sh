#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
RETICULUM_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
VENV_DIR="${RETICULUM_DIR}/.venv"

if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3 was not found. Install Python 3 and its venv support for your distribution, then rerun." >&2
  exit 1
fi

python3 --version
python3 -m venv "${VENV_DIR}" || {
  echo "Could not create the virtual environment. Your distribution may require its Python venv package." >&2
  exit 1
}

"${VENV_DIR}/bin/python" -m pip install --upgrade pip
"${VENV_DIR}/bin/python" -m pip install rns
"${VENV_DIR}/bin/python" -c 'import RNS; print("Reticulum Python import: OK"); print("Module:", RNS.__file__)'

echo
echo "Installation and import check completed on this computer."
echo "Environment: ${VENV_DIR}"
echo "This does not verify peer discovery or offline message delivery."
echo "No firewall, router, system service, or network interface settings were changed."
