---
name: anthropics-skills
description: >-
  Standardized professional software engineering routines from Anthropic: thorough code reviews,
  clean code refactoring, interface documentation, and conventional git commit management.
  Use when reviewing pull requests/changes, writing documentation, or performing structural refactors.
---

# Anthropic Engineering Skills Collection

> Derived from `anthropics/skills`.

A curated set of standardized workflows for code reviews, maintainability refactoring, and documentation.

---

## 1. Code Review Workflow

When asked to review code or before committing significant changes, audit against these 4 pillars:

1. **Security & Data Safety**:
   - Are environment variables or secrets exposed?
   - Is user input sanitized before SQL/DOM injection points?
   - Are Supabase RLS (Row Level Security) policies properly enforced?
2. **Robustness & Error Boundaries**:
   - Are asynchronous promises properly handled with `try/catch` or fallback states?
   - Does the UI handle empty arrays, null/undefined properties without throwing white-screen errors?
3. **TypeScript Integrity**:
   - Avoid `any` types; prefer strict interfaces or type unions.
   - Ensure proper type inference for database schemas and API responses.
4. **Performance**:
   - Are expensive calculations memoized (`useMemo`) or callback handlers stabilized (`useCallback`) when passed to heavy children?
   - Are images optimized and lists virtualized if exceeding 100+ items?

---

## 2. Conventional Commits Standard

When preparing commits or update logs, adhere to conventional prefixes:
- `feat:` New features
- `fix:` Bug fixes
- `refactor:` Code restructurings without behavior changes
- `perf:` Performance optimizations
- `style:` Formatting, UI visual tweaks
- `docs:` Documentation or comment updates
- `chore:` Dependency updates, config tweaks
