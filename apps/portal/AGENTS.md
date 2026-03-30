# Project Agent Brief

## Product Surface Summary
- `/` is the portfolio landing page with constructivist styling (PortfolioHero, PortfolioGrid, AboutSection, PortfolioFooter).
- `/blog` lists posts in the editorial layout (Intro, HeroPost, MoreStories, Footer with PortfolioLinks).
- `/blog/posts/[slug]` renders Markdown articles sourced from `_posts/*.md`, including cover imagery, metadata, and markdown-styled content.
- Blog posts support dark/light theme switching via `ThemeSwitcher` (class-based `dark` mode) and maintain typography/spacing through `markdown-styles.module.css`.

## Technical Stack & Patterns
- Next.js 15 (App Router) with React 19 RC, TypeScript 5.5, Tailwind CSS 3.4.17, PostCSS with Autoprefixer.
- Fonts are loaded via `next/font` (`Noto Sans SC`, `Bebas Neue`, `Roboto Mono`) and exposed as CSS variables for Tailwind usage.
- Markdown is parsed with Remark + GFM; `remark-html` runs with `sanitize: false` to preserve trusted inline HTML (e.g., `<sup>`, anchor ids for references).
- Shared layout primitives: `Container` (responsive padding), `PostTitle`, `CoverImage`, `Avatar`, portfolio modules in `src/app/_components/portfolio`.

## Content Pipeline
- Blog content lives in `_posts/` using frontmatter (title, excerpt, coverImage, date, author).
- `scripts/new-post.js` scaffolds new posts from templates.
- Build expects local assets under `public/assets/**`; cover images are referenced via frontmatter paths.
- Tailwind theme extends accent tokens, medical red, constructivist palette, spacing scale (28), and custom shadows.

# Visual Design Guardrails

This project follows an editorial, minimalist identity. The rules below are binding when adding or refactoring UI. Deviation requires an explicit visual design review.

## Core Personality
- Keep layouts quiet and spacious; rely on negative space rather than heavy borders or backgrounds.
- Tone should feel editorial and confident: bold headlines, restrained body text, minimal ornamentation.
- Prefer neutral light themes with optional dark mode parity. Avoid introducing saturated backgrounds.

## Color & Contrast
- Base palette: white/neutral backgrounds, near-black text (`#111`–`#333`), and the shared Tailwind tokens (`accent-1`, `accent-2`, `accent-7`).
- Primary call-to-action color is pure black on white; hover states may invert (white on black) but stay monochrome.
- Accent hue for inline links is the default Tailwind blue via `hover:text-blue-600`. Do not introduce additional accent colors without reason.
- Respect `dark:` variants where present (e.g., `dark:bg-slate-800`, `dark:text-slate-400`). New components must supply complementary dark-mode classes.

## Typography
- Headline scale is exaggerated: `text-5xl`–`text-8xl` with `font-bold` and `tracking-tighter`. Use existing sizes for new hero/section titles.
- Body copy remains `text-lg leading-relaxed`. Nested markdown headings use the established scale (`text-3xl` for `h2`, `text-2xl` for `h3`).
- Maintain left alignment for long-form text; only the main hero title may center on smaller screens.
- Use the Noto Sans SC (思源黑体) via `next/font/google`. Keep dark-mode parity.

## Layout & Spacing
- Continue using the shared `Container` (`mx-auto px-5`) and the established vertical rhythm (`mt-16`, `mb-20`, Tailwind spacing 28) for major sections.
- Section layouts rely on responsive grids (`md:grid-cols-2`, generous `gap-x-16`, `gap-y-32`). Preserve these gap sizes to keep the airy composition.
- Constrain article content widths to `max-w-2xl` to maintain legibility.

## Imagery & Media
- Blog imagery is full-bleed inside the container with square corners, subtle elevation (`shadow-sm`) and enhanced hover depth (`hover:shadow-lg`). New media blocks should reuse this pattern.
- Avatar components stay circular with small footprints; keep them adjacent to author/date info and avoid additional framing.

## Interaction & Motion
- Keep interactions understated: underline links on hover, 200 ms transition timings, soft shadow changes. Avoid complex animations or large-scale motion unless scoped to the same softness.
- When adding buttons, match the existing pill-shaped black button style (`bg-black text-white`, border inverse on hover).

## Content Structure
- Feature hierarchy: Intro section → hero post → “More Stories” grid. New homepage blocks should slot into this vertical rhythm without overwhelming the hero.
- Maintain markdown semantics: headings, lists, and paragraphs spaced with the existing `.markdown` utilities.

## Implementation Checklist for New UI
1. Use Tailwind tokens already defined; extend theme only if the value generalises across the system.
2. Provide dark-mode counterparts for background and text colors.
3. Reuse shared components (Container, PostTitle, CoverImage, Avatar) before creating new variants.
4. Audit new typography against the scale above; adjust to the nearest existing size.
5. Validate hover/focus states to ensure contrast and interaction parity with current elements.

Adhering to these principles keeps the blog visually consistent across future iterations.
