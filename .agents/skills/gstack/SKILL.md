---
name: gstack
description: >-
  Essential developer toolchain and operational command workflows: typecheck, linting, build verification,
  dependency health, and Vitest test runner commands. Use when executing project diagnostics, verifying builds,
  or testing code changes before release.
---

# GStack — Essential Toolchain & Execution Commands

> Derived from `gstack` (23 tools in one setup).

Standard command sequences for maintaining project stability and verifying deliverables.

---

## 1. Quick Verification Commands

Run these commands using PowerShell in the workspace:

| Purpose | Command | Notes |
| :--- | :--- | :--- |
| **Type Check** | `npx tsc --noEmit` | Fast TypeScript type verification without compiling files. |
| **Lint Check** | `npx oxlint` or `npm run lint` | Fast linter verification to catch syntax or import issues. |
| **Unit Testing** | `npx vitest run` | Run Vitest test suite once and output results. |
| **Build Check** | `npm run build` | Full production build (Vite) to catch bundling or CSS errors. |
| **Preview** | `npm run preview` | Serve production build locally for verification. |

---

## 2. Pre-Commit Sanity Pipeline

Always run the sanity pipeline before declaring an issue fixed:
1. `npx tsc --noEmit` — ensure 0 type errors.
2. `npm run build` — ensure build compiles cleanly to `dist/`.
