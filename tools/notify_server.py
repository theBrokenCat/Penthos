#!/usr/bin/env python3
"""
notify_server.py — Servidor de notificaciones del pipeline de pentesting.

Ejecuta esto en una terminal en tu Mac ANTES de lanzar el lab:
    python3 tools/notify_server.py

Los agentes Docker te envían notificaciones en tiempo real vía
host.docker.internal:9876 cuando cada fase del pipeline completa.

Puerto por defecto: 9876 (configurable con --port)
"""

import argparse
import json
import sys
from datetime import datetime
from http.server import BaseHTTPRequestHandler, HTTPServer

# ── Colores ANSI ───────────────────────────────────────────────
RESET  = "\033[0m"
BOLD   = "\033[1m"
GREEN  = "\033[92m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
RED    = "\033[91m"
BLUE   = "\033[94m"
DIM    = "\033[2m"

ICONS = {
    "ok":     f"{CYAN}🔄{RESET}",
    "solved": f"{GREEN}✅{RESET}",
    "error":  f"{RED}❌{RESET}",
    "info":   f"{BLUE}ℹ️ {RESET}",
}

PHASE_COLORS = {
    "PIPELINE INICIADO":    CYAN,
    "PHASE_COMPLETE: explorer":  BLUE,
    "PHASE_COMPLETE: analyst":   YELLOW,
    "PHASE_COMPLETE: exploiter": GREEN,
    "PIPELINE COMPLETADO":  GREEN,
}


def print_notification(data: dict):
    phase   = data.get("phase", "?")
    domain  = data.get("domain", "")
    message = data.get("message", "")
    status  = data.get("status", "ok")

    now    = datetime.now().strftime("%H:%M:%S")
    icon   = ICONS.get(status, ICONS["info"])
    color  = PHASE_COLORS.get(phase, CYAN)

    width = 60
    print(f"\n{DIM}{'─' * width}{RESET}")
    print(f"  {icon}  {BOLD}{color}{phase}{RESET}  {DIM}[{now}]{RESET}")
    if domain:
        print(f"  {DIM}target:{RESET} {domain}")
    if message:
        print(f"  {message}")
    print(f"{DIM}{'─' * width}{RESET}")
    sys.stdout.flush()


class NotifyHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # silenciar logs HTTP por defecto

    def do_POST(self):
        if self.path != "/notify":
            self.send_response(404)
            self.end_headers()
            return

        length = int(self.headers.get("Content-Length", 0))
        body   = self.rfile.read(length)

        try:
            data = json.loads(body)
            print_notification(data)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"status":"ok"}')
        except Exception as e:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def do_GET(self):
        if self.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"status":"ok","service":"notify_server"}')
        else:
            self.send_response(404)
            self.end_headers()


def main():
    parser = argparse.ArgumentParser(description="Servidor de notificaciones del pipeline")
    parser.add_argument("--port", type=int, default=9876, help="Puerto (default: 9876)")
    parser.add_argument("--host", default="0.0.0.0", help="Host (default: 0.0.0.0)")
    args = parser.parse_args()

    server = HTTPServer((args.host, args.port), NotifyHandler)

    print(f"\n{BOLD}{GREEN}╔══════════════════════════════════════════╗{RESET}")
    print(f"{BOLD}{GREEN}║  OpenClaw Pentester — Notificaciones     ║{RESET}")
    print(f"{BOLD}{GREEN}╚══════════════════════════════════════════╝{RESET}")
    print(f"\n  Escuchando en {BOLD}http://0.0.0.0:{args.port}/notify{RESET}")
    print(f"  Accesible desde Docker: {BOLD}http://host.docker.internal:{args.port}/notify{RESET}")
    print(f"\n  {DIM}Esperando notificaciones del pipeline...{RESET}\n")
    sys.stdout.flush()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print(f"\n\n  {DIM}Servidor detenido.{RESET}\n")


if __name__ == "__main__":
    main()
