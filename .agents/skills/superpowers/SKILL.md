---
name: superpowers
description: >-
  Disciplined software engineering superpower procedures: test-driven development, deep root-cause
  debugging before coding, architectural planning, and systematic verification. Use when tackling
  complex bugs, major feature builds, refactors, or multi-step engineering tasks.
---

# Superpowers — Agentic Engineering & Rigorous Execution

> Derived from `obra/superpowers`.

This skill enforces strict discipline, structured planning, and verification before executing code changes.

---

## 1. The Core Engineering Loop

```
[ Understand & Reproduce ] ──> [ Hypothesize & Plan ] ──> [ Surgical Implementation ] ──> [ Verify & Test ]
```

### Phase 1: Understand Before Typing
- Never jump directly to editing code when presented with a bug or complex feature.
- Explicitly trace the execution flow, locate relevant files, and understand current behavior.
- State assumptions upfront. If requirements are ambiguous, clarify before coding.

### Phase 2: Hypothesis & Plan
- Formulate a hypothesis of why a bug occurs or what minimal changes are needed for a feature.
- Formulate a 2-4 step action plan.
- Identify edge cases, regression risks, and affected components.

### Phase 3: Surgical Implementation
- Implement the minimal amount of code needed to solve the issue.
- Touch only the files directly involved. Avoid rewriting unaffected functions or formatting unrelated files.

### Phase 4: Systematic Verification
- Run tests (`npm test`, `npm run lint`, or manual reproduction steps).
- Never report a task as complete without verifiable evidence (pass logs or visual proof).

---

## 2. Debugging Protocol for Hard Bugs

1. **Locate the delta**: What changed between when it worked and when it broke?
2. **Reproduce consistently**: Can the failure be triggered reliably in a test or script?
3. **Inspect inputs & outputs**: Log exact values flowing through the problematic function.
4. **Fix the root cause**: Do not patch over symptoms with defensive `try/catch` or null checks without addressing why the invalid state happened.
