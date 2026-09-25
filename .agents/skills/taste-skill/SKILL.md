---
name: taste-skill
description: >-
  Anti-slop frontend design framework for creating premium, high-taste user interfaces.
  Use this skill when designing landing pages, hero sections, luxury or modern brand identities,
  auditing a page to look more polished and expensive, or avoiding generic AI-generated aesthetics.
---

# Taste Skill — Premium & High-Aesthetic Frontend Design

> Derived from `Leonxlnx/taste-skill` ("The Anti-Slop Frontend Framework").

This skill guides the AI to design websites that feel intentional, high-end, and visually refined, moving away from amateurish or cookie-cutter templates.

---

## 1. The Core Philosophy of "Taste"

1. **Restraint over Exuberance**:
   - High-end design is defined by what you *leave out*, not what you pack in.
   - Use a **90/10 Rule**: 90% neutral backdrop (clean slates, deep blacks, warm whites, subtle grays) and 10% intentional accent color.
2. **Typography is 70% of UI**:
   - Editorial, confident typography immediately conveys premium value.
   - Use deliberate font weights: strong bold headlines with balanced tracking (`tracking-tight`), paired with clean, readable body copy (`tracking-normal leading-relaxed`).
3. **Breathing Room (White Space)**:
   - Amateurs fear empty space; professionals use it to command attention.
   - Double the default spacing: if you intuitively think `py-8`, try `py-16` or `py-20` on desktop sections.

---

## 2. Taste Guidelines: What Makes a Page Look "Expensive"

### A. Color & Lighting
- **Never use 100% pure black or neon primaries**: Instead of `#000000`, use `#0B0F19` or `#0F172A`. Instead of pure `#FF0000`, use refined crimsons or corals.
- **Subtle Surface Gradients**: Solid flat cards can look cheap. Use a 1%–2% gradient overlay (e.g., `bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-800 dark:to-slate-900`).
- **Inner Borders / Hairlines**: Fine 1px semi-transparent borders (`border border-slate-200/60 dark:border-slate-800/80`) give crisp edges.

### B. Micro-interactions & Tactility
- **Hover Transitions**: Always add `transition-all duration-200 ease-out`. Never have harsh sudden state swaps.
- **Subtle Scale & Lift**: On interactive cards, `hover:-translate-y-1 hover:shadow-lg` adds physical depth.
- **Button Polish**: Gradient sheen, crisp border, subtle ring on focus, active button scale (`active:scale-[0.98]`).

### C. Layout & Composition
- **Hero Sections**: Asymmetric balance, oversized compelling headlines, clear primary CTA with secondary subtle ghost CTA.
- **Feature Grids (Bento Box)**: Varied card sizes (1 large hero card + 2-3 supporting cards) create visual rhythm rather than a monotonous 3x3 identical grid.
- **Badges / Micro-labels**: Tiny uppercase labels with tracking (`text-xs uppercase font-semibold tracking-wider text-primary`) to categorize content.

---

## 3. Quick Redesign Checklist (Turning "Boring" into "Premium")

When auditing an existing page:
- [ ] Are elements cramped? Increase vertical section padding (`py-12 md:py-24`).
- [ ] Are cards too plain? Add subtle border hairlines, soft shadow, and hover lift.
- [ ] Are colors glaring? Tone down background saturation and emphasize neutral contrast.
- [ ] Is typography generic? Add `tracking-tight` on headings and ensure generous `leading-relaxed` on paragraph text.
