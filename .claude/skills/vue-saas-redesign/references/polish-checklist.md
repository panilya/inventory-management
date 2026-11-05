# Polish checklist

Walk through this at the end, with the app open in a browser. Fix what fails; note anything you could not check.

## Layout and navigation
- [ ] Every route that used to be in the top nav is in the sidebar, in a sensible order, with an icon and label.
- [ ] Exactly one nav item is highlighted on every page; `/` is not highlighted on other pages.
- [ ] Old top nav markup and its CSS are gone.
- [ ] Collapsed mode: icons centered, labels hidden, hover shows a tooltip/title, state survives a reload.
- [ ] Content area reflows smoothly when collapsing; no horizontal page scrollbar at any width.
- [ ] Page title appears once per page (topbar or in-page header, per the step 3 decision), and is correct on every route and after switching locale.
- [ ] Nothing sticky is offset by the old header height; the filter bar (if any) sits flush under the topbar.
- [ ] Every former header control (profile, language, notifications, filters) is present and opens correctly, and its dropdown is not clipped.

## Spacing and rhythm
- [ ] All pages share the same outer padding and max-width; views no longer add their own outer padding.
- [ ] Page headers look identical across views (title size, description, gap below).
- [ ] Gaps between cards / sections are the same everywhere (one or two token values, not five).
- [ ] Card padding and radius are consistent across views, modals included.
- [ ] No scoped view style still redefines a global class (`.page-header`, `.card-header`, `.card-title`...) with different values.
- [ ] Card grids fill their rows at 1440px with the sidebar expanded (no 4 + 1 orphan), and values in a row of KPI cards line up even when one label wraps.
- [ ] Table identifiers and badges don't wrap onto two lines; wide tables scroll inside their card.
- [ ] No leftover one-off pixel values in the files you touched (grep for `px` and odd rem values like `1.1rem`, `0.938rem`).

## Typography
- [ ] At most ~5 font sizes in active use; all come from the type scale.
- [ ] Clear hierarchy: page title > section/card title > body > muted labels.
- [ ] Long labels and names truncate with ellipsis instead of breaking the layout.
- [ ] Numbers in tables/KPIs align (consider `font-variant-numeric: tabular-nums`).

## Color and surfaces
- [ ] The app's original accent and status colors are preserved via tokens.
- [ ] Neutral background, white surfaces, 1px borders; shadows subtle (no heavy drop shadows).
- [ ] Status badges use status tokens only.
- [ ] Text contrast is readable: muted text on white is no lighter than slate-500 (`#64748b`).

## Interaction states
- [ ] Hover state on nav items, buttons, table rows, clickable cards.
- [ ] Visible `:focus-visible` ring on every interactive element (tab through the sidebar and a page).
- [ ] Buttons, inputs and selects share one height (`--control-h`) and radius.
- [ ] Loading, empty and error states still render and look intentional in the new styling.

## Responsive and accessibility
- [ ] At ~390px: sidebar hidden, menu button visible, drawer opens, closes on overlay click, Esc, and navigation.
- [ ] At ~390px with the desktop sidebar saved as collapsed: drawer still shows full labels and full footer controls.
- [ ] At ~390px every route has `scrollWidth <= innerWidth` (check each one, not just the first).
- [ ] Secondary sticky bars become static on mobile.
- [ ] At ~1024px: tables scroll horizontally inside their card rather than overflowing.
- [ ] `<nav aria-label>` on the sidebar nav; icon-only buttons have `aria-label`; decorative SVGs have `aria-hidden="true"`.
- [ ] Motion respects `prefers-reduced-motion`.
- [ ] No emojis used as icons or decoration.

## Technical
- [ ] Production build passes.
- [ ] No console errors or Vue warnings while clicking through every route.
- [ ] Script logic unchanged apart from shell component imports and nav metadata.
