#!/bin/bash
# ═══════════════════════════════════════════════════════════
# Tennis Academy — Start Script
# Double-click this file to launch the app.
# ═══════════════════════════════════════════════════════════

cd "$(dirname "$0")"

echo ""
echo "🎾  Tennis Academy"
echo "    Starting up..."
echo ""

# Check for Node.js
if ! command -v node &>/dev/null; then
  echo "❌  Node.js is not installed."
  echo "    Please install it from https://nodejs.org (click 'LTS')"
  echo ""
  read -p "    Press any key to exit..."
  exit 1
fi

# Check for .env
if [ ! -f "server/.env" ]; then
  echo "⚠️   No server/.env file found — Stripe payments won't work yet."
  echo "    To set up payments:"
  echo "    1. Copy .env.example  →  server/.env"
  echo "    2. Add your Stripe TEST key from https://dashboard.stripe.com/test/apikeys"
  echo ""
  echo "    The app will still load so you can preview the design."
  echo ""
fi

# Kill any existing server on port 3001
lsof -ti tcp:3001 | xargs kill -9 2>/dev/null

# Start the server
node server/server.js &
SERVER_PID=$!

# Wait briefly for it to bind
sleep 1.5

# Open the browser
open http://localhost:3001

echo "✅  App is running at: http://localhost:3001"
echo ""
echo "    Press Ctrl+C here (or close this window) to stop the server."
echo ""

# Keep terminal open while server runs
wait $SERVER_PID
