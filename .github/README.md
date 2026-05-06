# Continuous Integration Configuration

This directory contains GitHub Actions workflows for automated testing, linting, and security audits.

## Workflows

### backend-ci.yml
Runs on backend changes:
- Format check (cargo fmt)
- Linting (cargo clippy)
- Unit tests (cargo test)
- Security audit (cargo audit)
- Release build

### mobile-ci.yml
Runs on mobile changes:
- ESLint checks
- TypeScript type checking
- Jest tests
- npm/pnpm security audit

### docs-check.yml
Runs on documentation changes:
- Markdown linting
- Dead link detection

## Issue Templates

### bug_report.md
Template for reporting bugs with environment and reproduction steps.

### feature_request.md
Template for proposing new features with use cases and acceptance criteria.

### security.md
Template for security reports (directs to private email).

## Pull Request Template

pull_request_template.md provides a standard format for all PRs including:
- Description of changes
- Related issues
- Testing performed
- Deployment notes

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for submission guidelines.
