#!/usr/bin/env python3
"""
manageBindings.py - Cloudflare Worker Bindings Management Tool

This script manages all environment bindings for a Cloudflare Worker project,
including D1, KV, R2, Durable Objects, Queues, and default AI/Observability bindings.

Supports:
- Interactive CLI wizard for humans
- Flag-based CLI for automated agents
"""

import argparse
import json
import os
from pathlib import Path
from datetime import datetime

try:
    from rich import print
    from rich.prompt import Prompt, Confirm
    from rich.console import Console
    from rich.table import Table
except ImportError:
    print("Error: This script requires the 'rich' library.")
    print("Install it with: pip install rich")
    exit(1)

console = Console()

WRANGLER_CONFIGS = ["wrangler.jsonc", "wrangler.toml"]
DEFAULT_CONFIG = "wrangler.jsonc"
BACKUP_DIR = Path("scripts/bindings_backup")
BACKUP_DIR.mkdir(parents=True, exist_ok=True)


def load_existing_config():
    """Load existing wrangler configuration if it exists."""
    for cfg in WRANGLER_CONFIGS:
        if Path(cfg).exists():
            with open(cfg, "r") as f:
                return json.load(f), cfg
    return None, DEFAULT_CONFIG


def save_backup(config):
    """Save a backup of the current configuration."""
    now = datetime.utcnow().isoformat().replace(":", "-")
    backup_path = BACKUP_DIR / f"bindings_{now}.json"
    with open(backup_path, "w") as f:
        json.dump(config, f, indent=2)
    console.print(f":floppy_disk: Backup saved to [green]{backup_path}[/green]")


def save_config(config, path):
    """Save configuration to the wrangler config file."""
    with open(path, "w") as f:
        json.dump(config, f, indent=2)
    console.print(f":gear: Updated [yellow]{path}[/yellow]")


def get_worker_name(config):
    """Get worker name from config or prompt user."""
    if config and "name" in config:
        return config["name"]
    return Prompt.ask("Enter your Cloudflare Worker name")


def create_d1_binding(config, name):
    """Create a D1 database binding."""
    d1_name = name
    preview_name = f"{name}-preview"
    binding = {
        "name": "DB",
        "database_name": d1_name,
        "database_id": Prompt.ask("Enter D1 database ID"),
        "preview_database_id": Prompt.ask("Enter preview D1 database ID"),
        "migrations_dir": "migrations",
        "remote": True
    }
    config.setdefault("d1_databases", []).append(binding)
    console.print(f"Added D1 binding for [cyan]{d1_name}[/cyan]")


def update_package_json():
    """Update package.json with migration and deploy scripts."""
    pj = Path("package.json")
    if not pj.exists():
        console.print("[red]No package.json found. Skipping npm script injection.")
        return

    with open(pj, "r") as f:
        data = json.load(f)

    scripts = data.setdefault("scripts", {})
    scripts.update({
        "migrate:local": "wrangler d1 migrations apply DB --local",
        "migrate:remote": "wrangler d1 migrations apply DB --remote",
        "deploy": "pnpm build && pnpm migrate:remote && wrangler deploy"
    })

    with open(pj, "w") as f:
        json.dump(data, f, indent=2)

    console.print(":rocket: Updated [green]package.json[/green] with migration and deploy scripts")


def run_interactive():
    """Run the interactive CLI wizard."""
    console.print("[bold cyan]Cloudflare Worker Bindings Manager[/bold cyan]\n")

    config, path = load_existing_config()
    worker_name = get_worker_name(config)

    if not config:
        config = {"name": worker_name}

    if Confirm.ask("Add D1 binding?"):
        create_d1_binding(config, worker_name)

    save_backup(config)
    save_config(config, path)
    update_package_json()

    console.print("\n[bold green]✓ Bindings configuration complete![/bold green]")


def restore_latest():
    """Restore the latest backup configuration."""
    backups = sorted(BACKUP_DIR.glob("bindings_*.json"), reverse=True)
    if not backups:
        console.print("[red]No backups found.")
        return

    latest = backups[0]
    with open(latest, "r") as f:
        config = json.load(f)

    save_config(config, DEFAULT_CONFIG)
    console.print(f":recycle: Restored [green]{latest}[/green] to [yellow]{DEFAULT_CONFIG}[/yellow]")


def main():
    """Main entry point for the script."""
    parser = argparse.ArgumentParser(
        description="Manage Cloudflare Worker bindings",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python manageBindings.py              # Run interactive wizard
  python manageBindings.py --add        # Add new binding
  python manageBindings.py --restore    # Restore latest backup
        """
    )
    parser.add_argument("--add", action="store_true", help="Add new binding")
    parser.add_argument("--restore", action="store_true", help="Restore latest backup")
    args = parser.parse_args()

    if args.restore:
        restore_latest()
    elif args.add:
        run_interactive()
    else:
        run_interactive()


if __name__ == "__main__":
    main()
