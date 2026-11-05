<template>
  <aside
    id="app-sidebar"
    class="sidebar"
    :class="{ 'is-collapsed': effectiveCollapsed, 'is-open': mobileOpen }"
  >
    <div class="sidebar-brand">
      <span class="brand-mark" aria-hidden="true">{{ brandName.charAt(0) }}</span>
      <span class="brand-text">
        <span class="brand-name">{{ brandName }}</span>
        <span v-if="brandTagline" class="brand-tagline">{{ brandTagline }}</span>
      </span>
      <button class="sidebar-close" type="button" :aria-label="t('nav.closeMenu')" @click="closeMobile">
        <NavIcon name="close" />
      </button>
    </div>

    <nav class="sidebar-nav" :aria-label="t('nav.main')">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ 'is-active': isActive(item) }"
        :aria-current="isActive(item) ? 'page' : undefined"
        :title="effectiveCollapsed ? item.title : undefined"
      >
        <NavIcon :name="item.icon" />
        <span class="nav-label">{{ item.title }}</span>
      </router-link>
    </nav>

    <div class="sidebar-footer">
      <!-- Footer controls get the effective collapsed state: the drawer always shows full controls. -->
      <slot name="footer" :collapsed="effectiveCollapsed" />
      <button
        class="collapse-toggle"
        type="button"
        :aria-label="collapsed ? t('nav.expand') : t('nav.collapse')"
        :title="effectiveCollapsed ? t('nav.expand') : undefined"
        :aria-expanded="!collapsed"
        aria-controls="app-sidebar"
        @click="toggleCollapsed"
      >
        <NavIcon :name="collapsed ? 'expand' : 'collapse'" />
        <span class="nav-label">{{ t('nav.collapse') }}</span>
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
import { useI18n } from '../composables/useI18n'

defineProps({
  brandName: { type: String, required: true },
  brandTagline: { type: String, default: '' }
})

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const { collapsed, effectiveCollapsed, mobileOpen, toggleCollapsed, closeMobile } = useSidebar()

// Single source of truth: routes opt in with meta.nav. t() is called inside the computed so
// labels follow locale changes.
const navItems = computed(() =>
  router.getRoutes()
    .filter(r => r.meta?.nav)
    .map(r => ({ path: r.path, title: t(r.meta.titleKey), icon: r.meta.icon }))
)

// Root matches exactly (otherwise it is active everywhere); others also match sub-paths.
const isActive = (item) =>
  item.path === '/'
    ? route.path === '/'
    : route.path === item.path || route.path.startsWith(item.path + '/')

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
  background: var(--graphite-900);
  color: var(--graphite-300);
  z-index: var(--z-sidebar);
  min-width: 0;
  /* No overflow: hidden here - it would clip the footer dropdowns. The nav scrolls on its own. */
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  height: var(--topbar-h);
  padding: 0 16px;
  border-bottom: 1px solid var(--graphite-700);
  flex-shrink: 0;
}
.brand-mark {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: var(--radius-control);
  background: var(--signal);
  color: var(--graphite-900);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 20px;
  line-height: 1;
}
.brand-text { display: flex; flex-direction: column; min-width: 0; line-height: 1.2; }
.brand-name {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.005em;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.brand-tagline {
  font-size: 12px;
  color: var(--graphite-300);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sidebar-close { display: none; }

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px;
  overflow-y: auto;
}
.nav-item,
.collapse-toggle {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  height: 40px;
  padding: 0 12px;
  border-radius: var(--radius-control);
  color: var(--graphite-300);
  font-family: inherit;
  font-size: 15px;
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
  border: 0;
  background: transparent;
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease;
}
.nav-item:hover,
.collapse-toggle:hover {
  background: var(--graphite-700);
  color: #fff;
}
.nav-item.is-active {
  background: var(--graphite-700);
  color: #fff;
}
/* 3px amber bar on the left edge marks "you are here". */
.nav-item.is-active::before {
  content: '';
  position: absolute;
  left: -12px;
  top: 6px;
  bottom: 6px;
  width: 3px;
  border-radius: 0 2px 2px 0;
  background: var(--signal);
}
.nav-item:focus-visible,
.collapse-toggle:focus-visible,
.sidebar-close:focus-visible {
  outline: 2px solid var(--info);
  outline-offset: 2px;
}

.sidebar-footer {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  border-top: 1px solid var(--graphite-700);
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

.sidebar-overlay { display: none; }

@media (max-width: 767.98px) {
  .sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    width: var(--sidebar-w);
    max-width: 85vw;
    transform: translateX(-100%);
    transition: transform 150ms ease;
    z-index: var(--z-drawer);
  }
  .sidebar.is-open {
    transform: translateX(0);
    box-shadow: var(--shadow-pop);
  }
  .collapse-toggle { display: none; }
  .sidebar-close {
    display: grid;
    place-items: center;
    margin-left: auto;
    width: 32px;
    height: 32px;
    border: 0;
    border-radius: var(--radius-control);
    background: transparent;
    color: var(--graphite-300);
    cursor: pointer;
  }
  .sidebar-close:hover { background: var(--graphite-700); color: #fff; }
  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(28, 33, 39, 0.5);
    z-index: var(--z-overlay);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sidebar { transition: none; }
}
</style>
