import os
from pathlib import Path
import re
import subprocess

from django.test import SimpleTestCase
from django.conf import settings


REPOSITORY_ROOT = Path(__file__).resolve().parents[2]


class SecretConfigurationSecurityTests(SimpleTestCase):
    def test_required_backend_secrets_are_configured(self):
        required_variables = (
            "DJANGO_SECRET_KEY",
            "DATABASE_URL",
            "OPENAI_API_KEY",
        )

        missing = [
            name for name in required_variables
            if not os.environ.get(name, "").strip()
        ]

        self.assertEqual(
            missing,
            [],
            f"Missing required environment variables: {', '.join(missing)}",
        )

    def test_environment_files_are_gitignored(self):
        gitignore = (REPOSITORY_ROOT / ".gitignore").read_text(
            encoding="utf-8"
        ).splitlines()
        rules = {
            line.strip()
            for line in gitignore
            if line.strip() and not line.lstrip().startswith("#")
        }

        self.assertIn(".env", rules)
        self.assertIn(".env.*", rules)

    def test_source_code_contains_no_hardcoded_api_keys(self):
        excluded_parts = {
            ".git", ".venv", "node_modules", "dist", "build",
            "__pycache__",
        }
        text_extensions = {
            ".py", ".js", ".jsx", ".json", ".md", ".txt",
            ".yml", ".yaml", ".toml",
        }
        secret_patterns = (
            re.compile(r"sk-(?:proj-)?[A-Za-z0-9_-]{20,}"),
            re.compile(r"AKIA[0-9A-Z]{16}"),
            re.compile(
                r"(?:OPENAI_API_KEY|DJANGO_SECRET_KEY)\s*=\s*"
                r"['\"][^'\"]{12,}['\"]"
            ),
        )
        findings = []

        for path in REPOSITORY_ROOT.rglob("*"):
            relative_path = path.relative_to(REPOSITORY_ROOT)
            if (
                not path.is_file()
                or any(part in excluded_parts for part in relative_path.parts)
                or path.name == ".env"
                or path.suffix not in text_extensions
            ):
                continue

            try:
                content = path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                continue

            if any(pattern.search(content) for pattern in secret_patterns):
                findings.append(str(relative_path))

        self.assertEqual(
            findings,
            [],
            f"Potential hardcoded secrets found in: {', '.join(findings)}",
        )

    def test_git_history_contains_no_environment_files_or_secrets(self):
        object_list = subprocess.run(
            ["git", "rev-list", "--objects", "--all", "--reflog"],
            cwd=REPOSITORY_ROOT,
            check=True,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        ).stdout.splitlines()
        environment_paths = []

        for entry in object_list:
            parts = entry.split(" ", 1)
            if len(parts) != 2:
                continue
            path = parts[1]
            if Path(path).name == ".env" or ".env." in Path(path).name:
                environment_paths.append(path)

        self.assertEqual(
            environment_paths,
            [],
            "Environment files were found in Git history.",
        )

        commits = subprocess.run(
            ["git", "rev-list", "--all", "--reflog"],
            cwd=REPOSITORY_ROOT,
            check=True,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        ).stdout.splitlines()
        history_pattern = (
            r"sk-(proj-)?[A-Za-z0-9_-]{20,}|"
            r"AKIA[0-9A-Z]{16}|"
            r"postgres(ql)?://[^[:space:]]+:[^@[:space:]]+@"
        )
        findings = []

        for commit in commits:
            result = subprocess.run(
                [
                    "git", "grep", "-n", "-I", "-E", history_pattern,
                    commit, "--", ".", ":!frontend/package-lock.json",
                ],
                cwd=REPOSITORY_ROOT,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
            )
            if result.returncode == 0:
                for line in result.stdout.splitlines():
                    location = line.split(":", 3)
                    if len(location) >= 3:
                        findings.append(
                            f"{location[0][:12]} {location[1]}:{location[2]}"
                        )

        self.assertEqual(
            findings,
            [],
            f"Potential secrets found in Git history: {', '.join(findings)}",
        )

    def test_openai_key_is_referenced_only_by_backend(self):
        frontend_root = REPOSITORY_ROOT / "frontend"
        frontend_references = []

        for path in frontend_root.rglob("*"):
            if (
                not path.is_file()
                or any(
                    part in {"node_modules", "dist", "build"}
                    for part in path.parts
                )
            ):
                continue
            try:
                content = path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                continue
            if "OPENAI_API_KEY" in content:
                frontend_references.append(
                    str(path.relative_to(REPOSITORY_ROOT))
                )

        backend_ai_service = (
            REPOSITORY_ROOT / "backend" / "leads" / "ai_service.py"
        ).read_text(encoding="utf-8")

        self.assertEqual(frontend_references, [])
        self.assertIn('os.environ["OPENAI_API_KEY"]', backend_ai_service)


class DjangoDeploymentSecurityTests(SimpleTestCase):
    def test_debug_is_disabled(self):
        self.assertFalse(settings.DEBUG)

    def test_allowed_hosts_are_explicit_and_not_wildcarded(self):
        self.assertTrue(settings.ALLOWED_HOSTS)
        self.assertNotIn("*", settings.ALLOWED_HOSTS)

    def test_secret_key_is_production_strength(self):
        self.assertGreaterEqual(len(settings.SECRET_KEY), 50)
        self.assertGreaterEqual(len(set(settings.SECRET_KEY)), 5)
        self.assertFalse(settings.SECRET_KEY.startswith("django-insecure-"))

    def test_cors_is_restricted_to_explicit_origins(self):
        self.assertFalse(settings.CORS_ALLOW_ALL_ORIGINS)
        self.assertFalse(settings.CORS_ALLOW_CREDENTIALS)
        self.assertTrue(settings.CORS_ALLOWED_ORIGINS)
        self.assertNotIn("*", settings.CORS_ALLOWED_ORIGINS)

    def test_csrf_and_session_cookies_are_hardened(self):
        self.assertIn(
            "django.middleware.csrf.CsrfViewMiddleware",
            settings.MIDDLEWARE,
        )
        self.assertTrue(settings.CSRF_COOKIE_SECURE)
        self.assertTrue(settings.CSRF_COOKIE_HTTPONLY)
        self.assertEqual(settings.CSRF_COOKIE_SAMESITE, "Lax")
        self.assertTrue(settings.SESSION_COOKIE_SECURE)
        self.assertTrue(settings.SESSION_COOKIE_HTTPONLY)
