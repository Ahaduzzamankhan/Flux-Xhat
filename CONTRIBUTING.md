# Contributing to Fluxenite Chat

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the Fluxenite Chat project.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/fluxenite-chat.git
   cd fluxenite-chat
   ```
3. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
cargo run
```

### Mobile

```bash
cd mobile
pnpm install
pnpm start
# In another terminal:
pnpm android
```

## Code Standards

### Rust Backend

- Format code with `cargo fmt`
- Lint with `cargo clippy`
- Write tests for new features
- Add documentation comments to public functions

```bash
cargo fmt -- --check
cargo clippy -- -D warnings
cargo test
```

### TypeScript Mobile

- Use ESLint for linting
- Follow the existing code style
- Use TypeScript strict mode
- Add JSDoc comments for complex functions

```bash
pnpm lint
pnpm type-check
```

## Commit Guidelines

Follow conventional commit format:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation
- `style` — Code style (formatting, missing semicolons, etc.)
- `refactor` — Code refactoring
- `perf` — Performance improvement
- `test` — Adding or updating tests
- `chore` — Build process, dependencies, etc.

**Examples:**
```
feat(auth): add JWT token refresh endpoint
fix(websocket): handle reconnection timeout properly
docs(api): update endpoint documentation
```

## Pull Request Process

1. **Update the code** following code standards above
2. **Add tests** for new features
3. **Update documentation** if needed
4. **Commit with descriptive messages** following commit guidelines
5. **Push to your fork** and create a Pull Request

### PR Title Format

```
[type] Brief description (ref: #123)
```

Example: `[feat] Add message search functionality (ref: #42)`

### PR Description Template

```markdown
## Description
Brief explanation of what the PR does.

## Related Issue
Fixes #123

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe how you tested this change.

## Screenshots (if applicable)
Add screenshots for UI changes.

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes
```

## Testing

### Backend Tests

```bash
cd backend
cargo test
```

### Mobile Tests

```bash
cd mobile
pnpm test
```

## Documentation

- Document public APIs with comments
- Update README.md for major changes
- Add examples for new features
- Keep docs in `.Claude/skills/SKILL.md` updated

## Security

- Never commit `.env` files or secrets
- Never commit Firebase service account keys
- Use environment variables for sensitive data
- Report security vulnerabilities privately to [security@yourdomain.com](mailto:security@yourdomain.com)

## Review Process

- At least one maintainer review required
- CI/CD tests must pass
- Code coverage should not decrease
- Maintainers may request changes

## Release Process

Maintainers will:

1. Update version in `Cargo.toml` and `package.json`
2. Update `CHANGELOG.md`
3. Create a git tag
4. Build and test release artifacts
5. Publish to GitHub Releases

## Questions?

- Open an issue for bugs or features
- Check existing issues/PRs before creating duplicates
- Join our community chat [insert link]

Thank you for contributing! 🚀
