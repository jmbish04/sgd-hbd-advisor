# -*- coding: utf-8 -*-
#!/usr/bin/env python3
"""
Drizzle Configuration Validation Script

Checks that all Drizzle-related configuration is properly set up for D1 database usage.
Supports both wrangler.toml and wrangler.jsonc configuration formats.
"""

import os
import sys
import json
import re

try:
    from pathlib import Path
except ImportError:
    # Python < 3.4 fallback
    class Path:
        def __init__(self, path):
            self.path = os.path.abspath(path)

        def __str__(self):
            return self.path

        def __div__(self, other):  # Python 2 compatibility
            return Path(os.path.join(self.path, str(other)))

        def __truediv__(self, other):  # Python 3 compatibility
            return Path(os.path.join(self.path, str(other)))

        def exists(self):
            return os.path.exists(self.path)

        def is_file(self):
            return os.path.isfile(self.path)

        @property
        def suffix(self):
            return os.path.splitext(self.path)[1]

        @property
        def parent(self):
            return Path(os.path.dirname(self.path))
try:
    from typing import Dict, List, Optional, Tuple, Any
except ImportError:
    # Python < 3.5
    Dict = dict
    List = list
    Optional = None
    Tuple = tuple
    Any = object


class Colors:
    """ANSI color codes for terminal output."""
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    NC = '\033[0m'  # No Color


class Symbols:
    """Symbols for status indicators."""
    SUCCESS = '+'
    ERROR = 'x'
    WARNING = '!'
    INFO = 'i'


class DrizzleValidator:
    """Validates Drizzle configuration for Cloudflare D1."""

    def __init__(self, project_root):
        self.project_root = project_root
        self.errors = []
        self.warnings = []
        self.successes = []

    def log_success(self, message):
        """Log a successful check."""
        print("{}{}{} {}".format(Colors.GREEN, Symbols.SUCCESS, Colors.NC, message))
        self.successes.append(message)

    def log_error(self, message):
        """Log an error."""
        print("{}{}{} {}".format(Colors.RED, Symbols.ERROR, Colors.NC, message))
        self.errors.append(message)

    def log_warning(self, message):
        """Log a warning."""
        print("{}{}{} {}".format(Colors.YELLOW, Symbols.WARNING, Colors.NC, message))
        self.warnings.append(message)

    def log_info(self, message):
        """Log informational message."""
        print("{}{}{} {}".format(Colors.BLUE, Symbols.INFO, Colors.NC, message))

    def check_file_exists(self, file_path, description):
        """Check if a file exists and is readable."""
        if not file_path.exists():
            self.log_error("{} not found: {}".format(description, file_path))
            return False

        if not file_path.is_file():
            self.log_error("{} is not a file: {}".format(description, file_path))
            return False

        try:
            with open(str(file_path), 'r') as f:
                f.read(1)  # Try to read at least one character
        except (IOError, UnicodeDecodeError):
            self.log_error("{} is not readable: {}".format(description, file_path))
            return False

        self.log_success("{} exists: {}".format(description, file_path))
        return True

    def parse_drizzle_config(self, config_path):
        """Parse drizzle.config.ts file."""
        try:
            with open(str(config_path), 'r') as f:
                content = f.read()

            config = {}

            # Extract schema path
            schema_match = re.search(r"schema:\s*['\"]([^'\"]+)['\"]", content)
            if schema_match:
                config['schema'] = schema_match.group(1)

            # Extract out path
            out_match = re.search(r"out:\s*['\"]([^'\"]+)['\"]", content)
            if out_match:
                config['out'] = out_match.group(1)

            # Extract dialect
            dialect_match = re.search(r"dialect:\s*['\"]([^'\"]+)['\"]", content)
            if dialect_match:
                config['dialect'] = dialect_match.group(1)

            # Extract driver
            driver_match = re.search(r"driver:\s*['\"]([^'\"]+)['\"]", content)
            if driver_match:
                config['driver'] = driver_match.group(1)

            # Extract dbCredentials
            db_creds_match = re.search(r"dbCredentials:\s*\{([^}]+)\}", content, re.DOTALL)
            if db_creds_match:
                creds_content = db_creds_match.group(1)
                db_name_match = re.search(r"dbName:\s*['\"]([^'\"]+)['\"]", creds_content)
                if db_name_match:
                    config['dbName'] = db_name_match.group(1)

                wrangler_path_match = re.search(r"wranglerConfigPath:\s*['\"]([^'\"]+)['\"]", creds_content)
                if wrangler_path_match:
                    config['wranglerConfigPath'] = wrangler_path_match.group(1)

            return config

        except Exception as e:
            self.log_error("Failed to parse drizzle.config.ts: {}".format(e))
            return None

    def parse_wrangler_config(self, config_path):
        """Parse wrangler.toml or wrangler.jsonc file."""
        try:
            with open(str(config_path), 'r') as f:
                content = f.read()

            if config_path.suffix == '.jsonc':
                # Remove comments for JSONC
                content = re.sub(r"//.*$|/\*[\s\S]*?\*/", "", content, flags=re.MULTILINE)
                return json.loads(content)
            else:
                # Basic TOML-like parsing (simplified)
                config = {}
                current_section = None
                array_section = None

                for line in content.split('\n'):
                    line = line.strip()
                    if not line or line.startswith('#'):
                        continue

                    # Section headers
                    if line.startswith('['):
                        if line.startswith('[['):
                            # Array section
                            section_name = line[2:-2]
                            if section_name not in config:
                                config[section_name] = []
                            array_section = section_name
                            current_section = None
                        else:
                            # Regular section
                            section_name = line[1:-1]
                            config[section_name] = {}
                            current_section = section_name
                            array_section = None
                        continue

                    # Key-value pairs
                    if '=' in line:
                        key, value = line.split('=', 1)
                        key = key.strip()
                        value = value.strip()

                        # Remove quotes
                        if value.startswith('"') and value.endswith('"'):
                            value = value[1:-1]
                        elif value.startswith("'") and value.endswith("'"):
                            value = value[1:-1]

                        # Parse arrays
                        if value.startswith('[') and value.endswith(']'):
                            value = [item.strip().strip('"').strip("'") for item in value[1:-1].split(',') if item.strip()]

                        if array_section:
                            if not config[array_section]:
                                config[array_section].append({})
                            config[array_section][-1][key] = value
                        elif current_section:
                            config[current_section][key] = value
                        else:
                            config[key] = value

                return config

        except Exception as e:
            self.log_error("Failed to parse wrangler config: {}".format(e))
            return None

    def check_drizzle_config(self):
        """Check drizzle.config.ts configuration."""
        self.log_info("Checking Drizzle configuration file...")

        drizzle_config_path = self.project_root / "drizzle.config.ts"
        if not self.check_file_exists(drizzle_config_path, "Drizzle config file"):
            return False

        config = self.parse_drizzle_config(drizzle_config_path)
        if not config:
            return False

        # Check schema file
        self.log_info("Checking schema file...")
        schema_path = config.get('schema')
        if not schema_path:
            self.log_error("Could not extract schema path from drizzle.config.ts")
            return False

        schema_file = self.project_root / schema_path
        if self.check_file_exists(schema_file, "Schema file"):
            # Check if schema file has content
            try:
                with open(str(schema_file), 'r') as f:
                    content = f.read()
                    if not content.strip():
                        self.log_warning("Schema file is empty")
            except Exception:
                self.log_warning("Could not read schema file content")

        # Check migrations output directory
        self.log_info("Checking migrations directory configuration...")
        out_path = config.get('out')
        if not out_path:
            self.log_error("Could not extract migrations output path from drizzle.config.ts")
            return False

        self.log_success("Migrations output path configured: {}".format(out_path))

        migrations_dir = self.project_root / out_path
        if migrations_dir.exists():
            self.log_success("Migrations directory exists")
        else:
            self.log_warning("Migrations directory does not exist yet (will be created on first migration)")

        # Check dialect and driver
        self.log_info("Checking Drizzle configuration values...")
        dialect = config.get('dialect')
        if dialect == 'sqlite':
            self.log_success("Dialect is correct for D1: sqlite")
        else:
            self.log_error("Dialect should be 'sqlite' for D1, found: {}".format(dialect))

        driver = config.get('driver')
        if driver == 'd1':
            self.log_success("Driver is correct: d1")
        else:
            self.log_error("Driver should be 'd1', found: {}".format(driver))

        return True

    def check_wrangler_config(self):
        """Check wrangler configuration."""
        self.log_info("Checking Wrangler configuration...")

        # Check for both .toml and .jsonc files
        wrangler_toml = self.project_root / "wrangler.toml"
        wrangler_jsonc = self.project_root / "wrangler.jsonc"

        wrangler_config_path = None
        if wrangler_jsonc.exists():
            wrangler_config_path = wrangler_jsonc
        elif wrangler_toml.exists():
            wrangler_config_path = wrangler_toml
        else:
            self.log_error("Neither wrangler.toml nor wrangler.jsonc found")
            return False

        if not self.check_file_exists(wrangler_config_path, "Wrangler config file"):
            return False

        config = self.parse_wrangler_config(wrangler_config_path)
        if not config:
            return False

        # Check D1 database configuration
        self.log_info("Checking D1 database binding...")
        d1_databases = config.get('d1_databases', [])
        if not d1_databases:
            self.log_error("No D1 databases found in wrangler config")
            return False

        d1_config = d1_databases[0]  # Use first D1 database
        binding = d1_config.get('binding')
        db_name = d1_config.get('database_name')
        migrations_dir = d1_config.get('migrations_dir')
        db_id = d1_config.get('database_id')

        if binding:
            self.log_success("D1 binding found: {}".format(binding))
        else:
            self.log_error("D1 binding not configured")

        if db_name:
            self.log_success("D1 database name: {}".format(db_name))
        else:
            self.log_error("D1 database name not configured")

        if db_id and db_id != "YOUR_D1_DATABASE_ID_HERE":
            self.log_success("D1 database ID is configured")
        else:
            self.log_warning("D1 database ID is not set or is a placeholder")

        if migrations_dir:
            self.log_success("migrations_dir configured in wrangler: {}".format(migrations_dir))
        else:
            self.log_warning("migrations_dir not explicitly set in wrangler (will default to ./migrations)")

        return True

    def check_config_alignment(self, drizzle_config, wrangler_config):
        """Check alignment between drizzle and wrangler configs."""
        self.log_info("Checking configuration alignment...")

        # Check database names match
        drizzle_db_name = drizzle_config.get('dbName')
        d1_databases = wrangler_config.get('d1_databases', [])
        wrangler_db_name = d1_databases[0].get('database_name') if d1_databases else None

        if drizzle_db_name and wrangler_db_name:
            if drizzle_db_name == wrangler_db_name:
                self.log_success("Database names match: {}".format(drizzle_db_name))
            else:
                self.log_error("Database names do not match!")
                self.log_error("  drizzle.config.ts dbName: {}".format(drizzle_db_name))
                self.log_error("  wrangler config database_name: {}".format(wrangler_db_name))
                return False

        # Check migrations directories match
        drizzle_out = drizzle_config.get('out')
        d1_databases = wrangler_config.get('d1_databases', [])
        wrangler_migrations_dir = d1_databases[0].get('migrations_dir') if d1_databases else None

        if wrangler_migrations_dir:
            # Normalize paths for comparison
            drizzle_normalized = drizzle_out.replace('./', '') if drizzle_out else ''
            wrangler_normalized = wrangler_migrations_dir.replace('./', '') if wrangler_migrations_dir else ''

            if drizzle_normalized == wrangler_normalized:
                self.log_success("Migrations paths match")
            else:
                self.log_error("Migrations paths do not match!")
                self.log_error("  drizzle.config.ts out: {}".format(drizzle_out))
                self.log_error("  wrangler migrations_dir: {}".format(wrangler_migrations_dir))
                return False
        else:
            # If no explicit migrations_dir in wrangler, check if drizzle uses default
            if drizzle_out != './migrations':
                self.log_error("migrations_dir not set in wrangler and drizzle out path is not './migrations'")
                return False

        # Check wrangler config path
        drizzle_wrangler_path = drizzle_config.get('wranglerConfigPath')
        if drizzle_wrangler_path:
            wrangler_file = self.project_root / drizzle_wrangler_path
            if wrangler_file.exists():
                self.log_success("Wrangler config path is valid")
            else:
                self.log_error("Wrangler config path in drizzle.config.ts does not exist: {}".format(drizzle_wrangler_path))
                return False

        return True

    def check_dependencies(self):
        """Check if required dependencies are installed."""
        self.log_info("Checking dependencies...")

        package_json = self.project_root / "package.json"
        if not package_json.exists():
            self.log_error("package.json not found")
            return False

        try:
            with open(str(package_json), 'r') as f:
                package_data = json.load(f)

            # Check for drizzle-kit
            if 'drizzle-kit' in package_data.get('devDependencies', {}):
                self.log_success("drizzle-kit found in package.json devDependencies")

                # Check if installed
                node_modules_drizzle = self.project_root / "node_modules" / "drizzle-kit"
                if node_modules_drizzle.exists():
                    self.log_success("drizzle-kit is installed")
                else:
                    self.log_warning("drizzle-kit not found in node_modules (run 'bun install' or 'npm install')")
            else:
                self.log_error("drizzle-kit not found in package.json dependencies")
                return False

            # Check for drizzle-orm (optional)
            if 'drizzle-orm' in package_data.get('dependencies', {}):
                self.log_success("drizzle-orm found in package.json dependencies")
            else:
                self.log_warning("drizzle-orm not found in package.json (may be intentional)")

        except Exception as e:
            self.log_error("Failed to parse package.json: {}".format(e))
            return False

        return True

    def check_package_scripts(self):
        """Check package.json scripts."""
        self.log_info("Checking package.json scripts...")

        package_json = self.project_root / "package.json"
        if not package_json.exists():
            return False

        try:
            with open(str(package_json), 'r') as f:
                package_data = json.load(f)

            scripts = package_data.get('scripts', {})

            expected_scripts = {
                'db:gen': 'db:gen script',
                'db:migrate:local': 'db:migrate:local script',
                'db:migrate:remote': 'db:migrate:remote script'
            }

            for script_name, description in expected_scripts.items():
                if script_name in scripts:
                    self.log_success("{} found".format(description))
                else:
                    self.log_warning("{} not found in package.json".format(description))

        except Exception as e:
            self.log_error("Failed to parse package.json: {}".format(e))
            return False

        return True

    def validate(self):
        """Run all validation checks."""
        print("{}{}{}".format(Colors.BLUE, '=' * 80, Colors.NC))
        print("{}{}  Drizzle Configuration Validation{}".format(Colors.BLUE, ' ' * 20, Colors.NC))
        print("{}{}{}".format(Colors.BLUE, '=' * 80, Colors.NC))
        print()

        # Parse configurations
        drizzle_config_path = self.project_root / "drizzle.config.ts"
        if not drizzle_config_path.exists():
            self.log_error("drizzle.config.ts not found")
            return False

        drizzle_config = self.parse_drizzle_config(drizzle_config_path)
        if not drizzle_config:
            return False

        # Find wrangler config
        wrangler_config_path = None
        if (self.project_root / "wrangler.jsonc").exists():
            wrangler_config_path = self.project_root / "wrangler.jsonc"
        elif (self.project_root / "wrangler.toml").exists():
            wrangler_config_path = self.project_root / "wrangler.toml"

        if not wrangler_config_path:
            self.log_error("Neither wrangler.jsonc nor wrangler.toml found")
            return False

        wrangler_config = self.parse_wrangler_config(wrangler_config_path)
        if not wrangler_config:
            return False

        # Run checks
        checks_passed = True
        checks_passed &= self.check_drizzle_config()
        print()
        checks_passed &= self.check_wrangler_config()
        print()
        checks_passed &= self.check_config_alignment(drizzle_config, wrangler_config)
        print()
        checks_passed &= self.check_dependencies()
        print()
        checks_passed &= self.check_package_scripts()

        # Summary
        print()
        print("{}{}{}".format(Colors.BLUE, '=' * 80, Colors.NC))
        print("{}{}  Summary{}".format(Colors.BLUE, ' ' * 25, Colors.NC))
        print("{}{}{}".format(Colors.BLUE, '=' * 80, Colors.NC))
        print()

        if not self.errors and not self.warnings:
            print("{}{}{}".format(Colors.GREEN, Symbols.SUCCESS, Colors.NC) + " All checks passed! Drizzle is properly configured.")
            return True
        elif not self.errors:
            print("{}{}{}".format(Colors.YELLOW, Symbols.WARNING, Colors.NC) + " Configuration is valid but has {} warning(s).".format(len(self.warnings)))
            print("{}{}{}".format(Colors.GREEN, Symbols.SUCCESS, Colors.NC) + " {} check(s) passed".format(len(self.successes)))
            print("{}{}{}".format(Colors.YELLOW, Symbols.WARNING, Colors.NC) + " {} warning(s)".format(len(self.warnings)))
            return True
        else:
            print("{}{}{}".format(Colors.RED, Symbols.ERROR, Colors.NC) + " Configuration has {} error(s) that must be fixed.".format(len(self.errors)))
            print("{}{}{}".format(Colors.GREEN, Symbols.SUCCESS, Colors.NC) + " {} check(s) passed".format(len(self.successes)))
            if self.warnings:
                print("{}{}{}".format(Colors.YELLOW, Symbols.WARNING, Colors.NC) + " {} warning(s)".format(len(self.warnings)))
            print("{}{}{}".format(Colors.RED, Symbols.ERROR, Colors.NC) + " {} error(s)".format(len(self.errors)))
            return False


def main():
    """Main entry point."""
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent

    validator = DrizzleValidator(project_root)
    success = validator.validate()

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
