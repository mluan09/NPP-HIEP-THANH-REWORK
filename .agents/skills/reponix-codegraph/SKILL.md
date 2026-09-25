---
name: reponix-codegraph
description: >-
  Codebase mapping, dependency graph tracing, and architecture indexing. Use when exploring
  an unfamiliar part of the codebase, tracing imported components and state stores, or packing
  key project files into a concise context map.
---

# Codebase Graph & Architecture Indexing

> Derived from `graphify`, `codegraph`, and `reponix`.

This skill provides fast methods to map out the codebase, trace module dependencies, and avoid wandering blindly through directory trees.

---

## 1. Project Architecture Blueprint (Vite + React + Supabase)

```
Root
├── src/
│   ├── components/       <-- Reusable UI components (buttons, modals, navbar)
│   ├── pages/            <-- Routed view pages
│   ├── hooks/            <-- Custom React hooks
│   ├── lib/ / utils/     <-- Supabase client, helpers, formatters
│   ├── types/            <-- TypeScript interfaces and DB schema definitions
│   └── App.tsx / main.tsx<-- Application entry points
├── public/               <-- Static assets, logos, public images
├── supabase/             <-- Supabase migrations and database configs
└── dist/                 <-- Production build output
```

---

## 2. Dependency Tracing Rules

When modifying or investigating a feature:
1. **Trace Entry Point**: Start from the route definition or user action trigger.
2. **Identify State Origin**: Pinpoint whether state lives locally in `useState`, in a React Context, or remote in Supabase tables.
3. **Check Side Effects**: Verify `useEffect` listeners, Supabase realtime channels, or event handlers.
4. **Inspect Schema Types**: Check the database schema definition to avoid mismatched column names or invalid nullables.
