import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'app:sidebar-collapsed'
// Keep in sync with the 768px CSS breakpoints (drawer below 768px).
const MOBILE_QUERY = '(max-width: 767.98px)'

// localStorage can throw (private mode, blocked storage) - never let that break the layout.
function readCollapsed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

const collapsed = ref(readCollapsed()) // desktop icon-rail mode (persisted)
const mobileOpen = ref(false) // mobile drawer visibility
const isMobile = ref(false) // viewport is at drawer breakpoint

watch(collapsed, (value) => {
  try {
    localStorage.setItem(STORAGE_KEY, value ? '1' : '0')
  } catch {
    /* ignore - collapse just won't persist */
  }
})

if (typeof window !== 'undefined' && window.matchMedia) {
  const mql = window.matchMedia(MOBILE_QUERY)
  isMobile.value = mql.matches
  mql.addEventListener('change', (e) => {
    isMobile.value = e.matches
    if (!e.matches) mobileOpen.value = false
  })
}

// Collapse is desktop-only: the drawer always renders full labels and full-size footer controls.
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
