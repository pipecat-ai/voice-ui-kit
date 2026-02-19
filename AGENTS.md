# AGENTS.md

Guidelines for AI agents and human contributors working on Voice UI Kit.

## Project Overview

**Voice UI Kit** (`@pipecat-ai/voice-ui-kit`) is a React component library for building voice AI applications with [Pipecat](https://github.com/pipecat-ai/pipecat). It provides components, hooks, and template apps for real-time voice, video, and AI interactions.

- **NPM**: `@pipecat-ai/voice-ui-kit`
- **Docs**: https://voiceuikit.pipecat.ai
- **License**: BSD-2-Clause

## Repository Structure

This is a **pnpm monorepo** (`pnpm@10.14.0`, Node >=18).

```
package/              Main library (publishable to NPM)
  src/                Library source code (React components, hooks, CSS)
  dist/               Build output (gitignored)
  tsup.config.ts      Build config (tsup — ESM + CJS + .d.ts)
  package.json        Version source of truth
  CHANGELOG.md        Auto-generated changelog (managed by Release Please)
docs/                 Documentation site (private, Fumadocs/Next.js)
examples/             Example applications (private)
  01-console/
  02-components/
  03-tailwind/
  04-vite/
  05-themes/
scripts/              Build scripts (CSS post-processing)
.github/workflows/    CI/CD workflows
```

### Key Configuration Files

| File | Purpose |
|------|---------|
| `package.json` (root) | Monorepo config, shared devDependencies, lint-staged |
| `package/package.json` | Library package — version, exports, peer dependencies |
| `release-please-config.json` | Release Please configuration |
| `.release-please-manifest.json` | Current version tracking (managed by Release Please) |
| `.commitlintrc.json` | Conventional commit rules |
| `pnpm-workspace.yaml` | Workspace definitions |

## Development Workflow

### Setup

```bash
pnpm install       # Install all dependencies (also sets up Husky hooks)
pnpm build         # Build the library
```

### Local Development

```bash
pnpm dev           # Component storybook (Ladle) for package/
pnpm dev:docs      # Documentation site (Next.js)
```

### Building

```bash
pnpm build         # Build the library (tsup + CSS processing via PostCSS/Tailwind 4)
```

### Linting

```bash
cd package && pnpm lint    # Run ESLint on package/src/
```

Linting also runs automatically on staged files via **lint-staged** during pre-commit.

## Commit Convention

This project enforces [**Conventional Commits**](https://www.conventionalcommits.org/) via Husky + commitlint.

### Format

```
<type>(<optional scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | Purpose | Appears in Changelog | Release Bump |
|------|---------|---------------------|--------------|
| `feat` | New feature | Yes | Minor |
| `fix` | Bug fix | Yes | Patch |
| `perf` | Performance improvement | Yes | Patch |
| `revert` | Revert a previous commit | Yes | Patch |
| `docs` | Documentation only | No | None |
| `style` | Formatting, whitespace | No | None |
| `refactor` | Code restructuring (no behavior change) | No | None |
| `test` | Adding or updating tests | No | None |
| `build` | Build system or dependency changes | No | None |
| `ci` | CI/CD configuration | No | None |
| `chore` | Maintenance tasks | No | None |

### Breaking Changes

Signal a breaking change by either:
- Adding `!` after the type: `feat!: remove deprecated API`
- Adding a `BREAKING CHANGE:` footer in the commit body

Breaking changes trigger a **major** version bump (or minor while pre-1.0).

### Examples

```
feat: add UserScreenShare component
fix(conversation): prevent message duplication on reconnect
docs: update AGENTS.md with new workflow
chore: update dependencies
feat!: redesign ThemeProvider API
```

## Release Process

Releases are automated with [**Release Please**](https://github.com/googleapis/release-please).

### How It Works

1. Merge PRs with conventional commit messages to `main`
2. Release Please automatically creates/updates a **Release PR** that:
   - Bumps the version in `package/package.json`
   - Updates `package/CHANGELOG.md`
   - Updates `.release-please-manifest.json`
3. When the Release PR is reviewed and merged:
   - A GitHub Release is created with a version tag
   - The package is automatically built and published to NPM

### RC / Prerelease

For release candidates, use the manual **"Publish RC"** workflow in GitHub Actions (`workflow_dispatch`). This bumps to a prerelease version (e.g., `0.8.0-rc.0`) and publishes to NPM under the `dev` tag.

### Important

- **Do not manually edit** `.release-please-manifest.json` or the version in `package/package.json` — Release Please manages these automatically.
- The changelog at `package/CHANGELOG.md` is auto-generated. Do not manually edit entries above the latest release heading.
- Only `feat`, `fix`, `perf`, and `revert` commits appear in the changelog. Use appropriate commit types so the changelog stays useful.

## Code Style

- **TypeScript** throughout
- **React** functional components with hooks
- **Tailwind CSS 4** with CSS variables for theming
- **Radix UI** for accessible primitives
- **Class Variance Authority (CVA)** for component variants
- **`cn()`** utility (tailwind-merge + clsx) for class name merging
- **Prettier** for formatting (semi, double quotes, 2-space indent)
- **ESLint** with TypeScript and React plugins

## Branching and PRs

- All changes go through **pull requests** — nothing is pushed directly to `main`
- The `build.yml` workflow runs a build check on every PR
