---
name: planning-with-files
description: >-
  Persistent context and session memory management through markdown files. Use when starting
  a new session, tracking long-running tasks, documenting architecture decisions, persisting
  work progress across restarts, or maintaining project changelogs.
---

# Planning With Files & Cross-Session Memory

> Derived from `planning-with-files` and `claude-mem`.

This skill ensures that project context, task lists, and architectural decisions survive across chat sessions and agent restarts by persisting them in file-based artifacts.

---

## 1. Memory Architecture

```
Project Root
├── UPDATE.md                 <-- User-facing progress log & release notes
├── TASK_QUEUE.md             <-- Live Kanban board / checklist of tasks
└── .agents/
    └── memory/
        ├── context.md        <-- Architectural decisions & active assumptions
        └── session_state.md  <-- Last working state, blockers, next steps
```

---

## 2. Session Protocol

### At the Start of a Session:
1. Check `TASK_QUEUE.md` or `UPDATE.md` to identify what was last accomplished.
2. Read `.agents/memory/context.md` if present to load key constraints, database schema decisions, or API keys format.
3. State the current objective before picking up the next task.

### During Execution:
1. When a task milestone is reached, update `TASK_QUEUE.md` by marking the item completed `[x]`.
2. Keep edits in sync with reality — never leave stale "In Progress" flags.

### At the End of a Task / Turn:
1. Log new features or bug fixes into `UPDATE.md` with dates and descriptions.
2. If an open task has pending blockers, record them in `TASK_QUEUE.md` under **Blockers / Next Steps**.
