# Development Scripts

This directory contains development and management scripts for the Gold Standard Worker template.

## manageBindings.py

A Python CLI tool for managing Cloudflare Worker bindings (D1, KV, R2, Durable Objects, Queues, etc.).

### Prerequisites

```bash
pip install rich
```

### Usage

**Interactive Mode** (recommended for humans):
```bash
python scripts/manageBindings.py
```

**Add New Binding**:
```bash
python scripts/manageBindings.py --add
```

**Restore Latest Backup**:
```bash
python scripts/manageBindings.py --restore
```

### Features

- ✅ Interactive CLI wizard
- ✅ Automatic backup of all configuration changes
- ✅ D1 database binding management
- ✅ Automatic `package.json` script updates
- ✅ Support for preview environments
- 🚧 KV, R2, Durable Objects, Queues (coming soon)

### Backups

All configuration changes are automatically backed up to `scripts/bindings_backup/` with timestamps.

## Future Scripts

This directory will contain additional development scripts:
- Database seeding utilities
- Migration helpers
- Testing utilities
- Deployment automation
