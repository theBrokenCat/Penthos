#!/usr/bin/env python3
"""
switch_model.py — Cambia el modelo LLM de todos los agentes de OpenClaw Pentester.

Uso:
    python3 switch_model.py
"""

import json
import os
import sys
from pathlib import Path

# ── Modelos disponibles ────────────────────────────────────────────────────────

MODELS = {
    "1": {
        "label":   "Anthropic — Claude Haiku 4.5 (rápido, económico)",
        "model":   "claude-haiku-4-5-20251001",
        "env_key": "ANTHROPIC_API_KEY",
    },
    "2": {
        "label":   "Anthropic — Claude Sonnet 4.5 (más capaz, más caro)",
        "model":   "claude-sonnet-4-5",
        "env_key": "ANTHROPIC_API_KEY",
    },
    "3": {
        "label":   "Google — Gemini 2.0 Flash (tier gratuito, generoso en rate limits)",
        "model":   "google/gemini-2.0-flash",
        "env_key": "GEMINI_API_KEY",
    },
    "4": {
        "label":   "Google — Gemini 2.5 Flash (más capaz)",
        "model":   "google/gemini-2.5-flash",
        "env_key": "GEMINI_API_KEY",
    },
    "5": {
        "label":   "Ollama local — qwen3.5:9b (sin coste, requiere Ollama corriendo)",
        "model":   "ollama/qwen3.5:9b",
        "env_key": None,
    },
    "6": {
        "label":   "Ollama local — llama3.1:8b",
        "model":   "ollama/llama3.1:8b",
        "env_key": None,
    },
}

# ── Rutas de los configs ───────────────────────────────────────────────────────

BASE_DIR    = Path(__file__).parent
CONFIG_DIR  = BASE_DIR / "pentester" / "config"
AGENT_FILES = ["supervisor.json", "explorer.json", "analyst.json", "exploiter.json"]


# ── Helpers ────────────────────────────────────────────────────────────────────

def color(text, code):
    return f"\033[{code}m{text}\033[0m"

def green(t):  return color(t, "32")
def yellow(t): return color(t, "33")
def cyan(t):   return color(t, "36")
def bold(t):   return color(t, "1")
def red(t):    return color(t, "31")


def read_current_model():
    """Lee el modelo actualmente configurado en supervisor.json."""
    path = CONFIG_DIR / "supervisor.json"
    try:
        with open(path) as f:
            data = json.load(f)
        return data["agents"]["defaults"]["model"]["primary"]
    except Exception:
        return "desconocido"


def update_agent_config(filepath: Path, new_model: str) -> bool:
    """Actualiza el modelo en un archivo de config de agente."""
    with open(filepath) as f:
        data = json.load(f)

    data["agents"]["defaults"]["model"]["primary"] = new_model

    with open(filepath, "w") as f:
        json.dump(data, f, indent=2)
        f.write("\n")

    return True


def check_env_key(env_key: str) -> bool:
    """Verifica si la variable de entorno necesaria está en el .env."""
    env_path = BASE_DIR / ".env"
    if not env_path.exists():
        return False
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line.startswith(f"{env_key}="):
                value = line.split("=", 1)[1].strip()
                return bool(value) and not value.startswith("tu-") and not value.startswith("cambia")
    return False


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    print()
    print(bold("╔══════════════════════════════════════════════════╗"))
    print(bold("║      OpenClaw Pentester — Switch Model           ║"))
    print(bold("╚══════════════════════════════════════════════════╝"))
    print()

    current = read_current_model()
    print(f"  Modelo actual: {yellow(current)}")
    print()
    print("  Selecciona el nuevo modelo:\n")

    for key, opt in MODELS.items():
        marker = green("  ✓") if opt["model"] == current else "   "
        print(f"{marker} {bold(key)}) {opt['label']}")
        print(f"       modelo: {cyan(opt['model'])}")
        print()

    # Pedir opción
    while True:
        choice = input("  Opción [1-6]: ").strip()
        if choice in MODELS:
            break
        print(red("  Opción inválida. Introduce un número del 1 al 6."))

    selected = MODELS[choice]

    # Si es el mismo, no hacer nada
    if selected["model"] == current:
        print()
        print(yellow("  Ya estás usando ese modelo. No hay cambios que aplicar."))
        return

    # Advertencia si la API key puede faltar
    if selected["env_key"]:
        if not check_env_key(selected["env_key"]):
            print()
            print(yellow(f"  ⚠️  Aviso: no se detectó {selected['env_key']} en el .env."))
            print(f"     Asegúrate de añadirla antes de recrear los contenedores.")

    # Confirmar
    print()
    print(f"  Cambiar de  {yellow(current)}")
    print(f"  a           {green(selected['model'])}")
    print()
    confirm = input("  ¿Confirmar? [s/N]: ").strip().lower()
    if confirm not in ("s", "si", "sí", "y", "yes"):
        print(red("  Cancelado."))
        return

    # Aplicar cambios
    print()
    errors = []
    for filename in AGENT_FILES:
        filepath = CONFIG_DIR / filename
        if not filepath.exists():
            errors.append(f"No encontrado: {filepath}")
            continue
        try:
            update_agent_config(filepath, selected["model"])
            print(f"  {green('✓')} {filename}")
        except Exception as e:
            errors.append(f"{filename}: {e}")
            print(f"  {red('✗')} {filename} — {e}")

    if errors:
        print()
        print(red("  Algunos archivos no se pudieron actualizar:"))
        for e in errors:
            print(f"    - {e}")
        sys.exit(1)

    print()
    print(green("  ✅ Modelo actualizado en los 4 agentes."))
    print()
    print("  Para aplicar los cambios ejecuta:")
    print(cyan("    docker-compose up -d --force-recreate supervisor explorer analyst exploiter"))
    print()


if __name__ == "__main__":
    main()
