---
name: ui-ux-pro-max
description: >-
  UI/UX design intelligence for web and mobile interfaces. Use this skill when designing,
  building, refactoring, or reviewing UI components, page layouts, styling with Tailwind CSS,
  typography, color schemes, animations, accessibility (WCAG), or auditing UI for visual anti-patterns.
---

# UI/UX Pro Max — Design Intelligence & Anti-Slop Guidelines

> Derived from `nextlevelbuilder/ui-ux-pro-max-skill`. Tailored for React, TypeScript, and Tailwind CSS.

This skill equips the agent with high-standard UI/UX reasoning to produce professional, accessible, and production-grade interfaces, eliminating generic "AI slop".

---

## 1. Core Priority Hierarchy

Follow priorities 1 → 10 when implementing or reviewing any user interface:

| Priority | Category | Critical Checks (Must Have) | Anti-Patterns to Avoid |
| :--- | :--- | :--- | :--- |
| **1** | **Accessibility (a11y)** | Contrast ≥ 4.5:1 (text), `alt` text for images, semantic HTML, visible keyboard focus rings (`focus-visible:ring-2`), ARIA labels on icon buttons. | Removing focus outlines (`outline-none` without replacement), icon-only buttons without `aria-label`. |
| **2** | **Touch & Interaction** | Minimum touch target 44×44px, interactive states (`hover:`, `active:`, `focus-visible:`), instant visual feedback on click, disabled states. | Relying solely on hover (breaks mobile), 0ms instant jump without smooth transition. |
| **3** | **Performance & CLS** | Modern image formats (WebP/AVIF), explicit width/height or aspect-ratio to prevent layout shift (CLS < 0.1), lazy loading. | Unbounded layout jumps when images load, massive uncompressed media assets. |
| **4** | **Style Consistency** | Cohesive visual language (flat, subtle glass, or modern clean card), SVG icons with consistent stroke width (Lucide / Heroicons). | Mixing random emojis with SVGs, mixing harsh skeuomorphism with flat design. |
| **5** | **Layout & Responsive** | Mobile-first approach, viewport-safe padding, flexbox/grid gap systems, no horizontal scrollbar overflow. | Fixed container widths (`w-[1200px]` breaking mobile), disabling zoom, horizontal scrolling bugs. |
| **6** | **Typography & Color** | Clear typographic scale (h1 > h2 > h3 > body), body ≥ 14px–16px, line-height 1.5–1.6, semantic color tokens. | Tiny illegible body text (<12px), low-contrast gray-on-gray, raw arbitrary hex colors everywhere. |
| **7** | **Micro-Animations** | Subtle transitions (150ms–250ms `ease-out`), meaningful feedback, respects `motion-reduce`. | Overlong animations (>400ms) that slow down user workflow, flashy bouncing effects. |
| **8** | **Forms & Inputs** | Clear floating or persistent labels, inline field validation with error messages, friendly empty/loading states. | Placeholder-only inputs (labels disappear when typing), generic unhelpful error messages. |
| **9** | **Navigation** | Sticky/fixed headers with blur backdrop, clear active nav indicator, mobile drawer/hamburger menu. | Overcrowded nav menus, trapped navigation states, broken back navigation. |
| **10**| **Data & Cards** | Clear visual hierarchy in cards, skeleton loaders during fetch, sensible badge/tag colors. | Wall of text without spacing, harsh solid borders around every single item. |

---

## 2. Tailwind CSS Styling Best Practices

1. **Color Tokens & Contrast**:
   - Use semantic color tokens (e.g., `text-slate-900 dark:text-slate-50`, `bg-white dark:bg-slate-900`).
   - Muted text should be at least `text-slate-500` or `text-slate-400` to maintain readable contrast.
2. **Spacing & Whitespace**:
   - Generous whitespace creates breathing room. Use consistent padding (`p-4 sm:p-6 lg:p-8`) and gaps (`gap-4`, `gap-6`).
3. **Card & Elevation Design**:
   - Prefer subtle borders with soft shadows: `border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow`.
   - Avoid heavy dark drop shadows (`shadow-2xl` on small elements).
4. **Modern Polish Details**:
   - Rounded corners: Modern web favors `rounded-xl` or `rounded-2xl` for containers, `rounded-lg` for buttons and inputs.
   - Glassmorphism: `backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border border-white/20`.

---

## 3. Pre-Delivery UI Quality Checklist

Before finishing any UI change, verify:
- [ ] Responsive test: Does it look great on 375px (mobile), 768px (tablet), and 1280px+ (desktop)?
- [ ] Hover & Active test: Do all buttons, links, and cards have hover and active states?
- [ ] Keyboard accessible: Can all actions be reached and triggered using `Tab` and `Enter`?
- [ ] No layout shifts: Are images and dynamic content properly sized?
- [ ] Loading & Empty states: What does the user see while data is loading or when a list is empty?
