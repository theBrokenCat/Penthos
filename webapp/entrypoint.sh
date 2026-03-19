#!/bin/sh
# Arregla permisos del volumen montado en runtime
mkdir -p /data /app/generated-reports
chown -R nextjs:nodejs /data /app/generated-reports 2>/dev/null || true
# Ejecuta el servidor como el usuario nextjs
exec gosu nextjs node server.js
