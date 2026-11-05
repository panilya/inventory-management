<template>
  <div class="app-shell" :class="{ 'is-collapsed': effectiveCollapsed }">
    <AppSidebar :brand-name="t('nav.companyName')" :brand-tagline="t('nav.subtitle')">
      <template #footer="{ collapsed }">
        <LanguageSwitcher :compact="collapsed" />
        <ProfileMenu
          :compact="collapsed"
          @show-profile-details="showProfileDetails = true"
          @show-tasks="showTasks = true"
        />
      </template>
    </AppSidebar>

    <div class="app-main">
      <!-- Page titles live in each view's .page-header, so the topbar holds only global controls. -->
      <header class="topbar">
        <button
          class="menu-button"
          type="button"
          :aria-label="t('nav.openMenu')"
          aria-controls="app-sidebar"
          :aria-expanded="mobileOpen"
          @click="openMobile"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span class="topbar-brand">{{ t('nav.companyName') }}</span>
        <FilterBar />
      </header>
      <main class="app-content">
        <router-view />
      </main>
    </div>

    <ProfileDetailsModal
      :is-open="showProfileDetails"
      @close="showProfileDetails = false"
    />

    <TasksModal
      :is-open="showTasks"
      :tasks="tasks"
      @close="showTasks = false"
      @add-task="addTask"
      @delete-task="deleteTask"
      @toggle-task="toggleTask"
    />
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { api } from './api'
import { useAuth } from './composables/useAuth'
import { useI18n } from './composables/useI18n'
import FilterBar from './components/FilterBar.vue'
import ProfileMenu from './components/ProfileMenu.vue'
import ProfileDetailsModal from './components/ProfileDetailsModal.vue'
import TasksModal from './components/TasksModal.vue'
import LanguageSwitcher from './components/LanguageSwitcher.vue'
import AppSidebar from './components/AppSidebar.vue'
import { useSidebar } from './composables/useSidebar'

export default {
  name: 'App',
  components: {
    FilterBar,
    ProfileMenu,
    ProfileDetailsModal,
    TasksModal,
    LanguageSwitcher,
    AppSidebar
  },
  setup() {
    const { currentUser } = useAuth()
    const { t } = useI18n()
    const { effectiveCollapsed, mobileOpen, openMobile } = useSidebar()
    const showProfileDetails = ref(false)
    const showTasks = ref(false)
    const apiTasks = ref([])

    // Merge mock tasks from currentUser with API tasks
    const tasks = computed(() => {
      return [...currentUser.value.tasks, ...apiTasks.value]
    })

    const loadTasks = async () => {
      try {
        apiTasks.value = await api.getTasks()
      } catch (err) {
        console.error('Failed to load tasks:', err)
      }
    }

    const addTask = async (taskData) => {
      try {
        const newTask = await api.createTask(taskData)
        // Add new task to the beginning of the array
        apiTasks.value.unshift(newTask)
      } catch (err) {
        console.error('Failed to add task:', err)
      }
    }

    const deleteTask = async (taskId) => {
      try {
        // Check if it's a mock task (from currentUser)
        const isMockTask = currentUser.value.tasks.some(t => t.id === taskId)

        if (isMockTask) {
          // Remove from mock tasks
          const index = currentUser.value.tasks.findIndex(t => t.id === taskId)
          if (index !== -1) {
            currentUser.value.tasks.splice(index, 1)
          }
        } else {
          // Remove from API tasks
          await api.deleteTask(taskId)
          apiTasks.value = apiTasks.value.filter(t => t.id !== taskId)
        }
      } catch (err) {
        console.error('Failed to delete task:', err)
      }
    }

    const toggleTask = async (taskId) => {
      try {
        // Check if it's a mock task (from currentUser)
        const mockTask = currentUser.value.tasks.find(t => t.id === taskId)

        if (mockTask) {
          // Toggle mock task status
          mockTask.status = mockTask.status === 'pending' ? 'completed' : 'pending'
        } else {
          // Toggle API task
          const updatedTask = await api.toggleTask(taskId)
          const index = apiTasks.value.findIndex(t => t.id === taskId)
          if (index !== -1) {
            apiTasks.value[index] = updatedTask
          }
        }
      } catch (err) {
        console.error('Failed to toggle task:', err)
      }
    }

    onMounted(loadTasks)

    return {
      t,
      effectiveCollapsed,
      mobileOpen,
      openMobile,
      showProfileDetails,
      showTasks,
      tasks,
      addTask,
      deleteTask,
      toggleTask
    }
  }
}
</script>

<style>
/* ===== Design tokens: "Industrial precision" ===== */
:root {
  /* Surfaces */
  --graphite-900: #1C2127;
  --graphite-700: #2A313A;
  --graphite-300: #9AA4AF;
  --steel-100: #ECEFF2;
  --steel-200: #DDE2E7;
  --rule: #D3D9DF;
  --panel: #FFFFFF;

  /* Text */
  --ink: #1A1F24;
  --ink-body: #36404A;
  --ink-muted: #5E6974;

  /* Safety amber (also "warn") */
  --signal: #E8A317;
  --signal-ink: #8A5A00;
  --signal-soft: #FCF1D9;

  /* Status */
  --ok: #2F8F5B;
  --ok-soft: #E1F2E8;
  --ok-ink: #1E6140;
  --info: #2D6CB5;
  --info-soft: #E2ECF8;
  --info-ink: #1F4E85;
  --bad: #C8402F;
  --bad-soft: #F8E3E0;
  --bad-ink: #8F2A1E;

  /* Type */
  --font-ui: 'Barlow', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --font-display: 'Barlow Semi Condensed', 'Barlow', system-ui, sans-serif;

  /* Shape and depth */
  --radius-panel: 6px;
  --radius-control: 4px;
  --radius-badge: 3px;
  --shadow-pop: 0 12px 32px rgba(28, 33, 39, 0.18);

  /* Layout */
  --sidebar-w: 232px;
  --sidebar-w-collapsed: 64px;
  --topbar-h: 56px;
  --content-max-w: 1440px;
  --content-pad-x: 28px;
  --content-pad-y: 28px;
  --control-h: 36px;

  /* Layers: sidebar/topbar sit below modals (2000) */
  --z-topbar: 40;
  --z-sidebar: 50;
  --z-overlay: 60;
  --z-drawer: 70;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-ui);
  font-size: 15px;
  line-height: 1.5;
  background: var(--steel-100);
  color: var(--ink-body);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1, h2, h3, h4 {
  font-family: var(--font-display);
  color: var(--ink);
  letter-spacing: -0.005em;
}

button, input, select, textarea {
  font-family: inherit;
}

:focus-visible {
  outline: 2px solid var(--info);
  outline-offset: 2px;
}

/* ===== Shell ===== */
.app-shell {
  display: grid;
  grid-template-columns: var(--sidebar-w) minmax(0, 1fr);
  min-height: 100vh;
}
.app-shell.is-collapsed {
  grid-template-columns: var(--sidebar-w-collapsed) minmax(0, 1fr);
}

/* minmax(0, 1fr) lets wide tables scroll inside their panel instead of stretching the page. */
.app-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: var(--z-topbar);
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: var(--topbar-h);
  padding: 8px var(--content-pad-x);
  background: var(--panel);
  border-bottom: 1px solid var(--rule);
}
.menu-button,
.topbar-brand {
  display: none;
}

.app-content {
  flex: 1;
  width: 100%;
  max-width: var(--content-max-w);
  padding: var(--content-pad-y) var(--content-pad-x) 48px;
}

@media (max-width: 767.98px) {
  .app-shell,
  .app-shell.is-collapsed {
    grid-template-columns: minmax(0, 1fr);
  }
  .topbar {
    height: var(--topbar-h);
    padding: 0 12px;
  }
  .menu-button {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border: 0;
    border-radius: var(--radius-control);
    background: transparent;
    color: var(--ink);
    cursor: pointer;
  }
  .menu-button:hover { background: var(--steel-100); }
  .topbar-brand {
    display: block;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 17px;
    color: var(--ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }
  .app-content {
    --content-pad-x: 16px;
    --content-pad-y: 16px;
  }
}

/* ===== Page header (markup: .page-header > h2 + p; add .page-header--actions for a right-side slot) ===== */
.page-header {
  margin-bottom: 24px;
}
.page-header--actions {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.page-header h2 {
  font-size: 26px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--ink);
  margin-bottom: 4px;
}
.page-header p {
  color: var(--ink-muted);
  font-size: 15px;
}

/* ===== Panels ===== */
.card,
.panel {
  background: var(--panel);
  border: 1px solid var(--rule);
  border-radius: var(--radius-panel);
  margin-bottom: 24px;
  /* No shadow: depth comes from the 1px rule only. */
}
.panel-body {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--rule);
}
.card-title {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--ink);
  letter-spacing: -0.005em;
}
.card-meta {
  font-size: 13px;
  color: var(--ink-muted);
  font-variant-numeric: tabular-nums;
}

/* ===== Stats (generic; the Overview KPI strip is built in Dashboard.vue) ===== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}
.stat-card {
  background: var(--panel);
  padding: 16px 20px;
  border-radius: var(--radius-panel);
  border: 1px solid var(--rule);
}
.stat-label {
  color: var(--ink-muted);
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
}
.stat-value {
  font-family: var(--font-display);
  font-size: 34px;
  font-weight: 600;
  line-height: 1.1;
  color: var(--ink);
  letter-spacing: -0.005em;
  font-variant-numeric: tabular-nums;
}
.stat-card.warning .stat-value { color: var(--signal-ink); }
.stat-card.success .stat-value { color: var(--ok-ink); }
.stat-card.danger .stat-value { color: var(--bad-ink); }
.stat-card.info .stat-value { color: var(--info-ink); }

/* ===== Tables ===== */
.table-container {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
}
thead {
  background: var(--steel-200);
}
th {
  text-align: left;
  padding: 10px 16px;
  font-weight: 600;
  color: var(--ink-muted);
  font-size: 13px;
  white-space: nowrap;
}
td {
  height: 44px;
  padding: 8px 16px;
  border-top: 1px solid var(--rule);
  color: var(--ink-body);
  font-size: 15px;
}
tbody tr:hover {
  background: var(--steel-100);
}
/* Helpers: numeric columns right-aligned, identifiers never wrap. */
.num, th.num, td.num { text-align: right; }
.nowrap { white-space: nowrap; }

/* ===== Badges (sentence case, 3px radius) ===== */
.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-badge);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.5;
  white-space: nowrap;
  background: var(--steel-200);
  color: var(--ink-body);
}
.badge.success,
.badge.increasing { background: var(--ok-soft); color: var(--ok-ink); }
.badge.warning,
.badge.medium { background: var(--signal-soft); color: var(--signal-ink); }
.badge.danger,
.badge.decreasing,
.badge.high { background: var(--bad-soft); color: var(--bad-ink); }
.badge.info,
.badge.low { background: var(--info-soft); color: var(--info-ink); }
.badge.stable { background: var(--steel-200); color: var(--ink-body); }

/* ===== Buttons ===== */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: var(--control-h);
  padding: 0 16px;
  border-radius: var(--radius-control);
  border: 1px solid var(--rule);
  background: var(--panel);
  color: var(--ink);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 120ms ease, border-color 120ms ease;
}
.btn:hover:not(:disabled) { background: var(--steel-100); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-primary {
  background: var(--ink);
  border-color: var(--ink);
  color: #fff;
}
.btn-primary:hover:not(:disabled) { background: var(--graphite-700); border-color: var(--graphite-700); }
.btn-secondary { background: var(--panel); border-color: var(--rule); color: var(--ink); }
.btn-sm {
  height: 28px;
  padding: 0 12px;
  font-size: 13px;
}

/* ===== Form controls ===== */
.input,
.select {
  width: 100%;
  min-width: 0;
  height: var(--control-h);
  padding: 0 12px;
  border: 1px solid var(--rule);
  border-radius: var(--radius-control);
  background: var(--panel);
  color: var(--ink);
  font-size: 15px;
}
.input:hover,
.select:hover { border-color: var(--graphite-300); }

/* ===== States ===== */
.loading {
  text-align: center;
  padding: 48px;
  color: var(--ink-muted);
  font-size: 15px;
}
.error {
  background: var(--bad-soft);
  border: 1px solid var(--bad);
  color: var(--bad-ink);
  padding: 12px 16px;
  border-radius: var(--radius-control);
  margin: 16px 0;
  font-size: 15px;
}

@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; animation: none !important; }
}
</style>
