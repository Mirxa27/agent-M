#!/bin/bash

# Start Xvfb
Xvfb :99 -screen 0 1920x1080x24 > /dev/null 2>&1 &

# Wait for Xvfb to be ready
sleep 1

# Optionally start VNC server for debugging
# x11vnc -display :99 -forever -nopw -shared -bg -rfbport 5900 -xkb -norc -noxrecord -noxfixes -noxdamage -noclipboard

# Start the browser automation service
NODE_ENV=production node server/browser-automation-worker.js