# Storybook Setup — Tasks

## 1. Setup

- [x] 1.1 Install Storybook dependencies (`@storybook/react-vite`, `@storybook/react`, `storybook`)
- [ ] 1.2 Install `@chromatic-como/test` for visual regression testing
- [x] 1.3 Create `.storybook/main.ts` with Vite builder configuration
- [x] 1.4 Create `.storybook/preview.ts` with global styles and theme
- [x] 1.5 Add `storybook` and `build-storybook` scripts to `packages/ui/package.json`

## 2. Stories

- [x] 2.1 Write Button stories (all variants, sizes, loading/disabled states)
- [x] 2.2 Write Card stories (CardHeader, CardContent, CardFooter)
- [x] 2.3 Write Input story (default, disabled, error states)
- [ ] 2.4 Write Select story (open/close, disabled)
- [x] 2.5 Write Form story (react-hook-form integration)
- [x] 2.6 Write Container story (maxWidth presets)
- [x] 2.7 Write Stack story (direction and gap props)

## 3. CSS Variables

- [x] 3.1 Create `packages/ui/src/styles/variables.css` with required CSS custom properties
- [x] 3.2 Import variables.css in `.storybook/preview.ts`

## 4. Verification

- [ ] 4.1 Run `pnpm --filter @hongyishi/ui storybook` and verify it starts on port 6006
- [x] 4.2 Verify all component stories appear in Storybook sidebar (via build output)
- [x] 4.3 Run `pnpm --filter @hongyishi/ui build-storybook` and verify static site generated
- [ ] 4.4 Add `storybook` CI check to GitHub Actions (optional)
