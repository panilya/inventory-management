# Reference shell implementation

A complete, dependency-free sidebar + topbar layout for Vue 3 + vue-router 4. Use it as a starting point and **adapt to the project's conventions**:

- The components below use `<script setup>`. If the project uses `export default { setup() { ... return {...} } }` or the Options API, convert them to that style - consistency with the codebase matters more than brevity.
- Replace `item.label` / `pageTitle` text with the project's i18n call (`t(item.titleKey)`, `$t(...)`) if it has one.
- Put the files where the project keeps similar things (`components/`, `composables/`, `layouts/`).

Contents:
1. Route meta
2. `useSidebar.js` composable
3. `navIcons.js` icon set
4. `AppSidebar.vue`
5. `AppTopbar.vue`
6. `App.vue` layout
7. Relocating header controls

---

## 1. Route meta

Add nav metadata to each top-level route. `nav: true` opts a route into the sidebar; routes without it (detail pages, login) stay out.

```js
const routes = [
  { path: '/',          component: Dashboard, meta: { nav: true, title: 'Overview',  titleKey: 'nav.overview',  icon: 'grid' } },
  { path: '/inventory', component: Inventory, meta: { nav: true, title: 'Inventory', titleKey: 'nav.inventory', icon: 'box' } },
  { path: '/orders',    component: Orders,    meta: { nav: true, title: 'Orders',    titleKey: 'nav.orders',    icon: 'cart' } },
  // ...
]
```

Optional: `meta.group: 'Analytics'` to render grouped sections with small uppercase headings.

If modifying routes is invasive, define `const navItems = [{ path, title, icon }, ...]` inside `AppSidebar.vue` instead.

## 2. `useSidebar.js`

Module-level refs so the sidebar, topbar and layout share one state without a store.

```js
import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'app:sidebar-collapsed'
const MOBILE_QUERY = '(max-width: 768px)'  // keep in sync with the CSS breakpoint

// localStorage can throw (private mode, blocked storage, SSR) - never let that break the layout.
function readCollapsed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

const collapsed = ref(readCollapsed())   // desktop icon-rail mode (persisted)
const mobileOpen = ref(false)            // mobile drawer visibility
const isMobile = ref(false)              // viewport is at drawer breakpoint

watch(collapsed, (value) => {
  try {
    localStorage.setItem(STORAGE_KEY, value ? '1' : '0')
  } catch {
    /* ignore - collapse just won't persist */
  }
})

// Collapse is desktop-only. JS consumers (e.g. a `compact` prop on footer controls) need to know
// when we're in drawer mode, because CSS alone can't un-collapse a component's props.
if (typeof window !== 'undefined' && window.matchMedia) {
  const mql = window.matchMedia(MOBILE_QUERY)
  isMobile.value = mql.matches
  mql.addEventListener('change', (e) => {
    isMobile.value = e.matches
    if (!e.matches) mobileOpen.value = false  // leaving mobile: drop the drawer state
  })
}

// What the UI should actually render: never icon-only inside the mobile drawer.
const effectiveCollapsed = computed(() => collapsed.value && !isMobile.value)

export function useSidebar() {
  return {
    collapsed,
    mobileOpen,
    isMobile,
    effectiveCollapsed,
    toggleCollapsed: () => { collapsed.value = !collapsed.value },
    openMobile: () => { mobileOpen.value = true },
    closeMobile: () => { mobileOpen.value = false }
  }
}
```

## 3. `navIcons.js`

Stroke icons on a 24x24 grid. Each icon is a list of path strings rendered with `stroke="currentColor"`, so they follow the link color. Add more as needed; keep the same style (stroke-only, round caps/joins). If the project already ships an icon library, use it instead.

```js
export const navIcons = {
  grid:      ['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M14 14h7v7h-7z', 'M3 14h7v7H3z'],
  box:       ['M21 8l-9-5-9 5 9 5 9-5z', 'M3 8v8l9 5 9-5V8', 'M12 13v8'],
  cart:      ['M3 3h2l2.4 12.2a2 2 0 0 0 2 1.8h8.2a2 2 0 0 0 2-1.6L21 8H6', 'M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2z', 'M18 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2z'],
  wallet:    ['M3 7a2 2 0 0 1 2-2h14v4', 'M3 7v10a2 2 0 0 0 2 2h16V9H5a2 2 0 0 1-2-2z', 'M16 14h.01'],
  trending:  ['M3 17l6-6 4 4 8-8', 'M15 7h6v6'],
  file:      ['M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z', 'M14 3v6h6', 'M8 13h8', 'M8 17h5'],
  list:      ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01'],
  users:     ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M22 21v-2a4 4 0 0 0-3-3.9', 'M16 3.1a4 4 0 0 1 0 7.8'],
  sliders:   ['M4 21v-7', 'M4 10V3', 'M12 21v-9', 'M12 8V3', 'M20 21v-5', 'M20 12V3', 'M1 14h6', 'M9 8h6', 'M17 16h6'],
  menu:      ['M4 6h16', 'M4 12h16', 'M4 18h16'],
  close:     ['M18 6L6 18', 'M6 6l12 12'],
  collapse:  ['M11 17l-5-5 5-5', 'M18 17l-5-5 5-5'],
  expand:    ['M13 17l5-5-5-5', 'M6 17l5-5-5-5'],
  dot:       ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z']
}
```

A tiny renderer component (`NavIcon.vue`):

```vue
<template>
  <svg class="nav-icon" viewBox="0 0 24 24" width="20" height="20" fill="none"
       stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"
       aria-hidden="true" focusable="false">
    <path v-for="d in paths" :key="d" :d="d" />
  </svg>
</template>

<script setup>
import { computed } from 'vue'
import { navIcons } from './navIcons'

const props = defineProps({ name: { type: String, default: 'dot' } })
const paths = computed(() => navIcons[props.name] || navIcons.dot)
</script>

<style scoped>
.nav-icon { flex-shrink: 0; }
</style>
```

## 4. `AppSidebar.vue`

```vue
<template>
  <aside
    id="app-sidebar"
    class="sidebar"
    :class="{ 'is-collapsed': collapsed, 'is-open': mobileOpen }"
  >
    <div class="sidebar-brand">
      <span class="brand-mark" aria-hidden="true">{{ brandName.charAt(0) }}</span>
      <span class="brand-text">
        <span class="brand-name">{{ brandName }}</span>
        <span v-if="brandTagline" class="brand-tagline">{{ brandTagline }}</span>
      </span>
      <button class="sidebar-close" type="button" aria-label="Close navigation" @click="closeMobile">
        <NavIcon name="close" />
      </button>
    </div>

    <nav class="sidebar-nav" aria-label="Main navigation">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ 'is-active': isActive(item) }"
        :title="effectiveCollapsed ? item.title : undefined"
      >
        <NavIcon :name="item.icon" />
        <span class="nav-label">{{ item.title }}</span>
      </router-link>
    </nav>

    <div class="sidebar-footer">
      <!-- Relocated header controls (profile menu, language switcher, ...) go here.
           Pass effectiveCollapsed, not collapsed: the drawer on mobile always shows full controls. -->
      <slot name="footer" :collapsed="effectiveCollapsed" />
      <button
        class="collapse-toggle"
        type="button"
        :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        :aria-expanded="!collapsed"
        aria-controls="app-sidebar"
        @click="toggleCollapsed"
      >
        <NavIcon :name="collapsed ? 'expand' : 'collapse'" />
        <span class="nav-label">Collapse</span>
      </button>
    </div>
  </aside>

  <div v-if="mobileOpen" class="sidebar-overlay" aria-hidden="true" @click="closeMobile" />
</template>

<script setup>
import { computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import NavIcon from './NavIcon.vue'
import { useSidebar } from '../composables/useSidebar'

defineProps({
  brandName: { type: String, required: true },
  brandTagline: { type: String, default: '' }
})

const router = useRouter()
const route = useRoute()
const { collapsed, effectiveCollapsed, mobileOpen, toggleCollapsed, closeMobile } = useSidebar()
// With i18n: const { t } = useI18n() and use t(r.meta.titleKey) below. Calling t() inside the
// computed keeps labels reactive to locale changes.

// Single source of truth: routes opt in with meta.nav. Order follows route definition order.
const navItems = computed(() =>
  router.getRoutes()
    .filter(r => r.meta?.nav)
    .map(r => ({ path: r.path, title: r.meta.title, icon: r.meta.icon }))
)

// Root matches exactly (otherwise it's "active" everywhere); other items also match sub-paths,
// so /orders/123 keeps "Orders" highlighted.
const isActive = (item) =>
  item.path === '/'
    ? route.path === '/'
    : route.path === item.path || route.path.startsWith(item.path + '/')

// Close the mobile drawer after navigating and on Escape.
watch(() => route.fullPath, closeMobile)
const onKeydown = (e) => { if (e.key === 'Escape' && mobileOpen.value) closeMobile() }
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  z-index: var(--z-sidebar);
  /* No overflow: hidden here - it would clip dropdowns opening from the footer. The nav scrolls on its own. */
  min-width: 0;
}

/* Brand */
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: var(--topbar-h);
  padding: 0 var(--space-4);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}
.brand-mark {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  background: var(--color-accent);
  color: var(--color-accent-contrast);
  font-weight: var(--weight-bold);
  font-size: var(--text-base);
}
.brand-text { display: flex; flex-direction: column; min-width: 0; }
.brand-name {
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.brand-tagline {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sidebar-close { display: none; }

/* Nav */
.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-3);
  overflow-y: auto;
}
.nav-item,
.collapse-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: 36px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  text-decoration: none;
  white-space: nowrap;
  border: 0;
  background: transparent;
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease), color var(--duration-fast) var(--ease);
}
.nav-item:hover,
.collapse-toggle:hover {
  background: var(--color-surface-muted);
  color: var(--color-text);
}
.nav-item.is-active {
  background: var(--color-accent-soft);
  color: var(--color-accent);
}
.nav-item:focus-visible,
.collapse-toggle:focus-visible,
.sidebar-close:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--color-focus);
}

/* Footer */
.sidebar-footer {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-3);
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
}

/* Collapsed icon rail: hide text visually but keep it for screen readers. */
.is-collapsed .sidebar-brand { padding: 0; justify-content: center; }
.is-collapsed .brand-text,
.is-collapsed .nav-label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
.is-collapsed .nav-item,
.is-collapsed .collapse-toggle { justify-content: center; padding: 0; }

/* Mobile drawer */
.sidebar-overlay { display: none; }

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    width: var(--sidebar-w);
    transform: translateX(-100%);
    transition: transform var(--duration) var(--ease);
    z-index: var(--z-drawer);
    box-shadow: var(--shadow-lg);
  }
  .sidebar.is-open { transform: translateX(0); }

  /* Collapse mode is a desktop concept; on mobile always show full labels. */
  .sidebar.is-collapsed .brand-text,
  .sidebar.is-collapsed .nav-label { position: static; width: auto; height: auto; clip: auto; }
  .sidebar.is-collapsed .sidebar-brand { padding: 0 var(--space-4); justify-content: flex-start; }
  .sidebar.is-collapsed .nav-item { justify-content: flex-start; padding: 0 var(--space-3); }

  .collapse-toggle { display: none; }
  .sidebar-close {
    display: grid;
    place-items: center;
    margin-left: auto;
    width: 32px;
    height: 32px;
    border: 0;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
  }
  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.4);
    z-index: var(--z-overlay);
  }
}
</style>
```

## 5. `AppTopbar.vue`

```vue
<template>
  <header class="topbar">
    <button
      class="menu-button"
      type="button"
      aria-label="Open navigation"
      aria-controls="app-sidebar"
      :aria-expanded="mobileOpen"
      @click="openMobile"
    >
      <NavIcon name="menu" />
    </button>
    <!-- Not a heading: views own the page's heading outline. Hide it (show-title=false) when
         views already render their own page title, so the title doesn't appear twice. -->
    <div v-if="showTitle" class="topbar-title">{{ pageTitle }}</div>
    <slot name="start" />
    <div class="topbar-actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import NavIcon from './NavIcon.vue'
import { useSidebar } from '../composables/useSidebar'

defineProps({ showTitle: { type: Boolean, default: true } })

const route = useRoute()
const { mobileOpen, openMobile } = useSidebar()

// With i18n: computed(() => t(route.meta?.titleKey)) - t() inside the computed stays reactive to locale.
const pageTitle = computed(() => route.meta?.title || '')
</script>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: var(--z-topbar);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: var(--topbar-h);
  padding: 0 var(--content-pad-x);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: saturate(180%) blur(8px);
  border-bottom: 1px solid var(--color-border);
}
.topbar-title {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  color: var(--color-text);
  letter-spacing: var(--tracking-tight);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.topbar-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.menu-button { display: none; }

@media (max-width: 768px) {
  .menu-button {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    margin-left: calc(var(--space-2) * -1);
    border: 0;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--color-text);
    cursor: pointer;
  }
  .menu-button:focus-visible { outline: none; box-shadow: 0 0 0 3px var(--color-focus); }
}
</style>
```

## 6. `App.vue` layout

```vue
<template>
  <div class="app-shell" :class="{ 'is-collapsed': collapsed }">
    <AppSidebar brand-name="Acme Inc" brand-tagline="Operations">
      <template #footer="{ collapsed }">
        <!-- e.g. <ProfileMenu :compact="collapsed" /> and <LanguageSwitcher /> -->
      </template>
    </AppSidebar>

    <div class="app-main">
      <!-- show-title=false when every view renders its own page header (avoids "Overview" twice). -->
      <AppTopbar :show-title="true">
        <template #actions>
          <!-- frequently used controls: search, notifications, primary action -->
        </template>
      </AppTopbar>
      <!-- Anything that used to sit directly under the header (e.g. a global filter bar).
           If it was sticky with top: <old header height>, change it to top: var(--topbar-h)
           and make it static on mobile. -->
      <main class="app-content">
        <router-view />
      </main>
    </div>

    <!-- Global modals stay where they were, outside the grid flow. -->
  </div>
</template>
```

Global layout CSS (unscoped, next to the tokens):

```css
body {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  background: var(--color-bg);
  color: var(--color-text-body);
  -webkit-font-smoothing: antialiased;
}

.app-shell {
  display: grid;
  grid-template-columns: var(--sidebar-w) minmax(0, 1fr);
  min-height: 100vh;
  transition: grid-template-columns var(--duration) var(--ease);
}
.app-shell.is-collapsed {
  grid-template-columns: var(--sidebar-w-collapsed) minmax(0, 1fr);
}
/* minmax(0, 1fr) lets wide tables scroll inside the content instead of stretching the page. */
.app-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.app-content {
  flex: 1;
  width: 100%;
  max-width: var(--content-max-w);
  margin: 0 auto;
  padding: var(--content-pad-y) var(--content-pad-x) var(--space-12);
}

@media (max-width: 768px) {
  .app-shell,
  .app-shell.is-collapsed { grid-template-columns: minmax(0, 1fr); }
}

/* Shared page header used by every view: stacked title + description by default.
   Views that also have actions wrap the text in a div and add .page-header--actions. */
.page-header {
  margin-bottom: var(--space-6);
}
.page-header--actions {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
}
.page-header h2 {
  font-size: var(--text-2xl);
  font-weight: var(--weight-bold);
  color: var(--color-text);
  letter-spacing: var(--tracking-tight);
  line-height: var(--leading-tight);
}
.page-header p {
  margin-top: var(--space-1);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-xs);
  /* Keep the app's existing vertical spacing mechanism (margin-bottom, grid gap, ...) and just
     tokenize it. Adding a new one such as `.card + .card` double-spaces cards that already have margins. */
}
```

Dropdowns relocated into the sidebar footer (override inside the component's own styles):

```css
/* Was: top: calc(100% + 0.5rem); right: 0; - opened downward from the header */
.dropdown-menu {
  top: auto;
  bottom: calc(100% + var(--space-2));
  left: 0;
  right: auto;
}
```

## 7. Relocating header controls

| Old header item | New home | Notes |
|---|---|---|
| Logo / app name | Sidebar brand block | Initial letter shows in collapsed mode. |
| Nav tabs | Sidebar nav | Driven by route meta. |
| Profile / account menu | Sidebar footer (or topbar right) | Its dropdown must open **upward** (`bottom: 100%`) or to the right when in the footer, and must not be clipped by an ancestor with `overflow` set; teleport it to `body` if needed. In collapsed mode show only the avatar. |
| Language / theme switcher | Sidebar footer | Compact select or icon button. Hide labels when collapsed. |
| Search, notifications | Topbar right | Used constantly, keep them one click away. |
| Global filter bar | Directly below the topbar, inside `.app-main` | Restyle as a single row of compact controls that wraps on small screens; use `--control-h`. |
| Page actions (Export, New...) | Page header right side | Keeps the topbar generic. |

When moving a component, keep its props/emits wiring identical - only its position and styling change.
