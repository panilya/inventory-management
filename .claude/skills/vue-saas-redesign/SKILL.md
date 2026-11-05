---
name: vue-saas-redesign
description: Redesign a Vue 3 application's UI into a modern, polished SaaS-style interface - replaces a horizontal top nav bar with a collapsible vertical sidebar on the left, introduces design tokens for consistent spacing/typography/color, and normalizes cards, tables, page headers and forms across every view. Use this skill whenever the user wants to redesign, modernize, restyle, "make professional", or "make it look like a SaaS dashboard / admin panel" a Vue 3 (or vue-router) app, asks to move navigation into a side nav or sidebar, wants consistent spacing or a design system pass, or complains the UI looks dated or inconsistent - even if they never say the word "sidebar".
---

# Vue SaaS Redesign

Turn an existing Vue 3 app into a clean, modern SaaS interface: a left sidebar for navigation, a slim topbar for page context, and a consistent spacing/typography system applied to every view - without changing what the app does.

The result should feel like a well-made product dashboard (think Linear, Vercel, Stripe dashboard): calm neutral surfaces, one accent color, generous but consistent whitespace, crisp 1px borders, clear hierarchy, and obvious active/hover/focus states.

## Guiding principles

- **Restyle, don't rewrite.** The user wants the same app looking better. Data fetching, emitted events, props, i18n keys, route paths and business logic stay exactly as they are. Changes are confined to templates (structure, classes, wrappers), styles, a few new shell components, and optional route `meta`. This keeps the redesign low-risk and reviewable.
- **Tokens before pixels.** Inconsistent spacing almost always comes from hard-coded values scattered across files. Define the scale once as CSS custom properties, then make everything reference it. That is what makes the result look "consistent" rather than just "different".
- **Keep the brand.** Reuse the app's existing accent, status colors and font when they exist - map them into tokens. A redesign that silently swaps the brand color is a surprise the user didn't ask for.
- **Every existing control stays reachable.** Anything in the old header (profile menu, language switcher, notifications, search, filters) must have a new home in the sidebar footer or the topbar. Losing a control is the most common redesign regression.
- **Follow project rules.** Read `CLAUDE.md` / `AGENTS.md` first (including nested ones like `client/CLAUDE.md`). If the project says certain files must be edited by a specific subagent (e.g. "delegate all `.vue` edits to vue-expert"), do that - hand the agent this skill's path and the relevant step. If you *are* that designated subagent, just do the work. If the project bans emojis or new dependencies, or prescribes a palette, honor it.

## Workflow

### 1. Audit (read-only)

Build a picture of the app before touching anything. Find:

- **Router**: `src/main.js`, `src/router/index.js`, or similar. Note route paths, names, whether `meta` exists, nested routes, and route guards.
- **App shell**: `App.vue` or a layout component (`layouts/*.vue`). Find the top nav markup and everything else rendered around `<router-view>` (filter bars, banners, modals).
- **Header contents**: list every control in the current header. Each needs a destination in the new layout (see step 3).
- **Styles**: where global styles live (`App.vue` unscoped `<style>`, `style.css`, `main.css`), whether CSS variables already exist, any CSS framework (Tailwind, Vuetify, Element Plus, PrimeVue). If a component framework provides its own layout/nav primitives, prefer its theming system over fighting it.
- **Conventions**: `<script setup>` vs `setup()` vs Options API; JS vs TS; i18n approach (`useI18n`, `$t`, custom composable); icon approach. Match whatever the project already uses in new components.
- **Views**: skim each view for its page header, card, table and spacing patterns. Note one-off values (e.g. `margin-top: 23px`, `padding: 1.1rem`) to normalize later.

Then run a few targeted greps over `src/`. Each one catches a regression that is invisible in the code but obvious on screen:

- `position: sticky|fixed` and `top:` values: anything offset by the old header height (e.g. a filter bar with `top: 70px`) will overlap or float once the header is gone.
- `z-index`: note the app's existing layers (dropdowns, modals) so the new sidebar/topbar/drawer sit correctly between them.
- `min-width` and fixed `width` in px: these cause horizontal scroll on mobile once the content column is narrower.
- Global class names (`.page-header`, `.card`, `.card-header`, `.card-title`, `.stat-card`, `table`, `.badge`...) redefined inside scoped view styles: scoped rules win over the global tokens you are about to write, which produces double padding and mismatched titles that you'd otherwise only spot in screenshots.
- Hard-coded nav/header strings that bypass i18n (e.g. a nav label typed directly in the template): they need a locale key when moved into route meta.

If the app can be run and Playwright (or another browser tool) is available, take "before" screenshots of each route at desktop width. They make the comparison in step 6 concrete.

Briefly summarize the audit to yourself (routes, header controls and where each will move, style entry point) before continuing.

### 2. Design tokens

Add a `:root` block of CSS custom properties to the global stylesheet, starting from `references/tokens.css`. Adapt it:

- Map the app's existing accent and status colors (success/warning/danger/info) into the color tokens.
- Keep the existing font family if one is set; otherwise use the system/Inter stack in the reference.
- Keep layout tokens: `--sidebar-w` (~240px), `--sidebar-w-collapsed` (~64px), `--topbar-h` (~56px), `--content-max-w`, `--content-pad-x`, `--content-pad-y`.
- Set the `--z-*` tokens relative to the z-index values you found in the audit (the sidebar/topbar must sit below existing dropdowns and modals), rather than using the reference numbers blindly.

Then convert existing global styles (cards, tables, badges, buttons, page headers) to use the tokens. Spacing should land on the 4px scale (`--space-1` = 4px ... `--space-12` = 48px); font sizes on the type scale. Don't introduce dark mode unless asked - it doubles the verification surface.

### 3. Build the shell

Replace the top nav with a two-column CSS Grid layout. Read `references/sidebar-shell.md` for a complete reference implementation (`AppSidebar.vue`, `AppTopbar.vue`, `useSidebar.js`, `App.vue` layout) and adapt it to the project's conventions.

Structure:

```
.app-shell  (grid: [sidebar] [main column])
├── AppSidebar            sticky, full height
│   ├── brand block       logo/name; name hides when collapsed
│   ├── <nav aria-label>  route links: icon + label
│   └── footer            profile menu, language switcher, collapse toggle
└── .app-main
    ├── AppTopbar         sticky; mobile menu button, page title, page-level actions
    ├── (filter bar etc.) whatever used to sit below the header
    └── <main class="app-content"> <router-view/>
```

Key behaviors and why they matter:

- **Nav items from routes.** Put `label` (or i18n key) and `icon` in route `meta`, and build the nav from `router.getRoutes()` filtered by `meta.nav`. One source of truth means new routes appear automatically. If editing the router is invasive (guards, generated routes), use a local `navItems` array in the sidebar instead - say which you chose.
- **Icons.** Inline SVG (24x24 viewBox, `stroke="currentColor"`, 1.75 stroke width, 18-20px rendered) so they inherit color and need no new dependency. If the project already uses an icon library, use that. No emojis as icons - they render inconsistently across platforms and read as unprofessional.
- **Active state.** Compute it from the current route: the root `/` matches exactly; every other item matches its own path and any sub-path (`/orders/123` keeps "Orders" highlighted). Relying only on `exact-active-class` loses the highlight on nested pages, and prefix matching on `/` highlights it everywhere.
- **i18n.** If the app has i18n, store a key in `meta` (`titleKey`) and call `t()` *inside* the computed or template, so labels and the page title update when the locale changes. Add locale keys for any label that was hard-coded before.
- **Collapse to icon rail.** A composable holds `collapsed` state, persisted to `localStorage` (wrapped in try/catch - storage can throw in private mode). When collapsed, hide labels visually, keep icons, and add `title`/`aria-label` on each link so the destination is still discoverable.
- **Mobile drawer.** Below ~768px the sidebar becomes an off-canvas drawer: hidden by default, opened by a menu button in the topbar, closed by overlay click, Esc, or route change. Collapse is a desktop-only concept: the composable also tracks `isMobile` via `matchMedia`, and anything driven by JS (e.g. a `compact` prop passed to slotted footer controls) must use `collapsed && !isMobile`. CSS alone can't fix that. Otherwise a saved collapsed state leaves icon-only controls inside the full-width drawer.
- **Topbar and page title, without duplicating them.** Users need page context once the brand header is gone, but showing the same title twice ("Overview" in the topbar and again as the page `<h2>`) looks unfinished. Decide once for the whole app:
  - If views already render their own page header (title + description), keep that as the title. Use the topbar for global controls (filter bar, search, notifications) or a quiet breadcrumb (`App / Section`), not a repeat of the title.
  - If views don't have page headers, show the route title in the topbar.
  - The topbar title is not a heading element if views have their own `<h1>`/`<h2>`, so the page keeps one heading outline.
- **Relocate header controls.** User/profile menus and app settings (language, theme) go in the sidebar footer, or in the topbar's right side if they're used constantly. Dropdowns that used to open downward (`top: calc(100% + gap)`) must open upward (`bottom: calc(100% + gap)`) and align left when they're in the footer. No ancestor may clip them with `overflow`. A dropdown wider than the sidebar may overlap the content, which is fine. See the table in `references/sidebar-shell.md`.
- **Fix sticky offsets.** Anything that was `top: <old header height>` now sits under the topbar (`top: var(--topbar-h)`), or at `top: 0` if it replaces the topbar. Sticky secondary bars (filters) should become static on mobile, because stacking two sticky bars eats a small viewport.

Remove the old top-nav markup and its styles once the shell works; dead CSS for `.top-nav` is noise for the next developer.

### 4. Consistent spacing and polish across views

Now sweep every view and shared component. The goal is that any two pages feel like the same product.

- **One page header pattern**: title (`--text-2xl`, 600-700 weight), optional description (`--text-sm`, muted), optional actions on the right; `margin-bottom: var(--space-6)`. Follow the title decision from step 3 consistently on every view.
- **One content container**: `.app-content` owns horizontal padding and max-width. Views shouldn't add their own outer padding.
- **Cards**: same radius, border, padding and gap everywhere. Grids of cards use `gap: var(--space-4)` or `var(--space-6)` consistently.
- **Tables**: consistent header style (small, uppercase or medium-weight, muted), row height, hover, and cell padding. Wrap in a card with horizontal scroll on overflow.
- **Forms and buttons**: one height (~36px), one radius, visible `:focus-visible` ring using `--color-focus`.
- **Badges/status**: reuse status tokens, no ad-hoc colors.
- **Modals**: same radius, padding, shadow, and header/footer layout.
- Replace one-off pixel values with tokens. When a value doesn't fit the scale, round to the nearest step rather than adding a new token. Leave the internals of custom charts (SVG coordinates, bar label offsets) alone unless they are visibly broken, because they are tuned to their data.

Prefer editing shared/global styles over repeating the same fix in every scoped style block. Where a scoped block redefines a global class (the grep from step 1), delete the scoped copy unless it is intentionally different, and keep any genuinely view-specific properties.

**The content column just lost ~240px.** Layouts that fit under a top nav often break beside a sidebar. Re-check every view at ~1440px:
- Card grids wrap awkwardly (5 KPI cards at `minmax(220px, 1fr)` become 4 + 1). Lower the min width or choose explicit column counts so rows stay full.
- Table cells wrap IDs, SKUs and badges onto two lines. Use `white-space: nowrap` on identifiers and badges, and let the table scroll inside its card.
- Cards in the same row should keep their content aligned: if one label wraps to two lines, the values below shouldn't drop out of line with the neighboring cards. Give labels a fixed line count or align card internals with flex/grid.

**Mobile sweep.** At ~390px, visit every route (not just one) and check `document.documentElement.scrollWidth <= innerWidth`. Fixed `min-width`s on search boxes, selects and tables are the usual culprits. A mobile override placed earlier in the file than the base rule loses to it, so put media queries after the rules they override.

### 5. Preserve behavior

Before verifying, re-check the diff for accidental logic changes: script blocks should only differ by imports of new shell components or `meta`-driven nav. Every route still reachable, every former header control still present and working, all modals still openable. If a comment would help a future reader understand a non-obvious layout decision (e.g. why the root route uses exact matching), add one.

### 6. Verify

- Run the build (`npm run build` or the project's equivalent) and fix any errors.
- With the app running, use Playwright (or the available browser tool):
  - Desktop (~1440px): visit every route through the sidebar; check active highlighting, page titles, no layout shift.
  - Collapse the sidebar; reload; confirm it stays collapsed and icons have tooltips.
  - Mobile (~390px): open the drawer from the topbar, navigate, confirm it closes; Esc and overlay close it too; no horizontal page scroll on any route. Repeat with the desktop sidebar saved as collapsed, to confirm the drawer still shows full labels.
  - Open every relocated control (profile menu, language switcher, filters, modals), and switch locale if the app has i18n.
  - Check the browser console for errors and Vue warnings. Compare against the original app, so you don't chase errors that existed before the redesign.
- Keep browser checks cheap. On data-heavy pages, Playwright navigate/evaluate calls may return a huge accessibility snapshot. Prefer screenshots plus small `evaluate` calls that return just the number you need (scrollWidth, active nav count), and move between pages by clicking sidebar links. Some browser tools save screenshots relative to their own working directory and ignore absolute paths, so check where the files actually landed.
- Compare with the "before" screenshots and run through `references/polish-checklist.md`.

## Reporting back

Summarize for the user: the new layout structure, where each former header control now lives, the token system (and which existing brand colors were preserved), which views were normalized, files added/changed, and verification results (including anything you could not verify). Offer follow-ups that were deliberately left out of scope, such as dark mode or nav grouping.

## Reference files

- `references/tokens.css` - starting `:root` token set (spacing, type, color, radius, shadow, layout). Read in step 2.
- `references/sidebar-shell.md` - reference implementation of the sidebar, topbar, composable and layout. Read in step 3.
- `references/polish-checklist.md` - final visual and accessibility checklist. Read in step 6.
