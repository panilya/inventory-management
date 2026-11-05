# Vue 3 optimization patterns

For each pattern: the signal (scanner rule id in brackets, if any), when it actually matters, and the idiomatic fix. "When it matters" is the important part, because it is what separates a useful finding from noise.

## Contents
- Correctness signals: unresolved components, orphan files, unused setup returns, empty watchers
- Rendering performance: keys, v-if with v-for, calls in loops, large lists, v-memo, v-show vs v-if, inline objects/handlers
- Reactivity: deep watchers, watch vs computed, shallowRef/markRaw, props destructuring
- Lifecycle and leaks: listeners, timers, observers
- Bundle and loading: lazy routes, async components, heavy imports
- Structure and reuse: large components, composables, shared components, duplicated helpers, duplicated CSS, scoped overrides of globals

---

## Correctness signals

### Unresolved components [unresolved-component]
- A tag used in a template that is never imported, registered locally, or registered globally renders nothing. Vue only logs a runtime warning, so the build passes and the feature silently doesn't work (e.g. a "Create PO" button whose modal never appears).
- **Always a top finding.** Fix by importing/registering the component, building it if it doesn't exist, or removing the dead UI. Ask the user which, since it's a product decision.

### Orphan files [orphan-file]
- Not reachable from the entry through static or dynamic imports. Usually dead code, sometimes a page whose route was forgotten. Don't spend optimization effort on it; recommend deleting it or wiring it up.
- Caveat: files loaded through `import.meta.glob`, plugin auto-imports (unplugin-vue-components) or string-based registration can look orphaned. Check the build config before calling them dead.

### Unused setup returns [unused-setup-return]
- Names returned from `setup()` that the template never references: leftovers from removed UI, or values computed on every change for nothing (an unused `computed` is lazy and cheap, but an unused watcher-fed ref isn't). Verify they aren't used through template refs or `expose`. Group these into one cleanup finding.

### Empty watchers [empty-watcher]
- A `watch` with an empty callback still tracks its sources and does nothing. Remove it, after checking whether a forgotten reload should be there.

### Data-loading drift
- Copy-pasted loaders (scanner: structurally identical functions, or same-named `loadData` variants) tend to drift. Look for:
  - an error flag that is set but never cleared on retry, so the page stays stuck on the error;
  - no guard against stale responses, where a slow earlier request overwrites a newer one after filters change;
  - inconsistent loading flags.
- One `useResource`/`useFilteredData` composable fixes all copies at once, so present it as a correctness finding, not just reuse.

---

## Rendering performance

### Missing or index keys [vfor-missing-key, vfor-index-key]
- **Matters when:** the list can reorder, filter, insert or remove items, or rows hold local state (inputs, expanded state, child component state, transitions). With index keys, Vue reuses the wrong DOM node and state follows the position, not the item. For static lists that never change order, it is cosmetic.
- **Fix:** key by a stable unique field (`id`, `sku`, `month`). If none exists, derive a stable one from the data, such as `${quarter}-${year}`, never from the index.

### v-if on the same element as v-for [vif-with-vfor]
- In Vue 3, `v-if` is evaluated first and can't see the loop variable, which is often a bug. Where it works, it still filters during render.
- **Fix:** filter in a `computed` and loop over that, or move `v-if` to a wrapping `<template v-for>`.

### Function calls inside v-for [calls-in-loop]
- Template functions run for every row on every render of the component. Cheap formatters (`formatDate`, `t()`) on small lists are fine.
- **Matters when:** the list is long (hundreds or more), the parent re-renders often (typing in a search box, live filters, intervals), or the function is non-trivial (searching another array, `new Intl.NumberFormat()` per call, regex, date parsing).
- **Fix:** build a `computed` that maps raw rows to display rows once per data change (`rows = computed(() => items.value.map(i => ({ ...i, priceLabel: fmt(i.price) })))`), and hoist formatter instances (`Intl.*Format`) to module scope. For lookups, replace `array.find` inside rows with a `computed` Map.

### Large lists
- **Matters when:** more than ~500 rows render at once, or more than ~100 heavy rows (child components, charts).
- **Fix:** paginate or "show more" (simplest, often the right UX anyway); virtual scrolling if the user truly needs to scroll everything (suggest a library only if the project accepts dependencies); `v-memo="[item.id, item.updatedAt, selectedId === item.id]"` on rows that rarely change while the parent re-renders.

### v-show vs v-if
- `v-if` destroys and recreates; `v-show` toggles CSS. For things toggled often (tabs, dropdowns) whose subtree is expensive, use `v-show`. For things rarely shown (modals, admin panels), `v-if` keeps them out of the initial render. Only report this when the subtree is heavy or toggling is frequent.

### Inline objects, arrays and arrow functions passed as props
- `:options="{ a: 1 }"` or `:items="list.filter(...)"` create a new value every render, so the child always re-renders and its watchers fire.
- **Matters when:** the child is expensive or watches that prop. **Fix:** hoist constants to module scope, and derived values to `computed`.

---

## Reactivity

### Deep watchers [deep-watch]
- `watch(obj, fn, { deep: true })` traverses the entire object graph on every trigger, and fires on any nested change.
- **Fix:** watch a getter for the exact fields (`watch(() => [filters.value.month, filters.value.category], ...)`), or replace it with a `computed` if the watcher only derives state. Vue 3.5+ supports `deep: <number>` to limit depth.

### Watcher that should be a computed
- Signal: a `watch` whose callback only assigns to another ref from the watched source.
- **Fix:** use `computed`. It is cached, synchronous, and can't get out of sync.

### Deep reactivity on large immutable data [large-reactive-literal]
- `ref(bigApiPayload)` makes every nested object reactive (a proxy per object), which costs on first access and memory.
- **Matters when:** payloads hold thousands of objects that are replaced wholesale rather than mutated per field (typical for API responses and chart data).
- **Fix:** `shallowRef` (reassign `.value` to update) or `markRaw` for static lookup tables. Don't do it if code mutates nested fields and expects reactivity.

### Destructured props lose reactivity
- `const { items } = props` in `setup()` captures the value once. Before Vue 3.5, the same applies in `<script setup>` with `defineProps` destructuring.
- **Fix:** `toRefs(props)`, `props.items`, or the 3.5+ reactive props destructure. This is a correctness finding; rank it high if found.

---

## Lifecycle and leaks

### Listener and timer leaks [listener-leak, interval-leak]
- Listeners on `window`/`document`, `setInterval`, `ResizeObserver`/`IntersectionObserver`, and websocket handlers added in a component must be removed in `onBeforeUnmount`/`onUnmounted`. Otherwise every visit to the page adds another, causing memory growth and duplicate handler calls.
- **Not a leak:** module-level singletons that intentionally live for the whole app, such as a `matchMedia` listener in a composable's module scope. Verify before reporting.
- **Fix:** pair add and remove in the same composable (`useEventListener`-style), or use an `AbortController` signal.

---

## Bundle and loading

### Static route imports [static-route-imports]
- Every view imported at the top of the router ships in the initial bundle.
- **Fix:** `component: () => import('./views/Reports.vue')` for routes not needed on first paint. Keep the landing route static if it matters for first load. Verify with `vite build`: there should be one chunk per lazy view.

### Eager heavy components
- Modals, charts, editors and maps that appear only after interaction. **Fix:** `defineAsyncComponent(() => import(...))`.

### Heavy dependencies for small uses
- Whole lodash/moment/chart libraries imported for one function. **Fix:** per-function imports, native APIs (`Intl`, `Array` methods), or a lighter library. Check `package.json` and the import sites.

---

## Structure and reuse

### Large components [large-component]
- Size is a prompt to look, not a finding by itself. Report a split only when you can name the pieces:
  - **Child components:** a template region with its own state and events, such as a KPI strip, a table with its sort/expand state, or a chart panel.
  - **Composables:** logic tied to a concern rather than to markup, such as data loading for a resource, filter syncing, pagination, or polling.
  - **Utils:** pure functions such as formatters, mappers and calculations.
- Give the proposed file names, what moves, and the props/emits interface between parent and child.

### Logic to extract into composables
- Signals: the same `ref` + `onMounted` + `watch(filters)` + `try/catch` data-loading block appears in several views. Many views re-implementing loading/error state is the classic composable candidate.
- **Fix:** `useResource(fetcher, deps)` returning `{ data, loading, error, reload }`, or one composable per domain, following the project's existing composables folder and naming.

### Duplicated helpers [duplicates.functions, sameNameFunctions]
- Identical bodies across files: move them to `utils/` (or the existing shared module) and import them.
- Same name but different bodies, for example `formatDate` with three implementations: often drift, so check whether the outputs differ (date formats, rounding, currency). Report which differences are intentional and which look like bugs, then propose one parameterized helper.
- Check existing shared modules first. A helper copied locally while `utils/` already has it is a quick win.

### Duplicated component shells
- Several components with the same overlay, header, close button and footer markup and CSS (modals, cards, dropdowns): extract a base component with slots (`<BaseModal title @close><slot/><template #footer>...`). This removes both template and CSS duplication and keeps behavior consistent (Esc to close, focus trap, scroll lock).

### Duplicated CSS [duplicates.css]
- The same rule body in many scoped style blocks. **Fix:** a shared component (best when markup is also shared), a global utility class, or design tokens if the duplication is mostly values (colors, spacing).
- Don't report small, coincidental matches (2-3 generic declarations like `display:flex; align-items:center`).

### Scoped styles redefining global classes [duplicates.scopedOverridesOfGlobals]
- A scoped `.card-header` overriding the global one makes pages look inconsistent and hides design-system changes. **Fix:** delete the scoped copy, or use a modifier class if the difference is intentional.

### Hard-coded colors
- Many hex literals in a component (`Hex colors` column) when the app has CSS variables: suggest tokens. Low impact; group into one finding.
