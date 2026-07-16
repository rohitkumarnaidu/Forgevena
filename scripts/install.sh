#!/usr/bin/env sh
set -eu
package="${1:-ai-engineering-workspace}"
command -v npm >/dev/null 2>&1 || { echo "Node.js 20.19+ and npm are required." >&2; exit 1; }
npm install --global "$package"
ai-workspace version
