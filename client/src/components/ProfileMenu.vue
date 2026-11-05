<template>
  <div class="profile-menu" :class="{ 'is-compact': compact }">
    <button
      class="profile-button"
      :title="compact ? currentUser.name : undefined"
      :aria-label="currentUser.name"
      aria-haspopup="menu"
      :aria-expanded="isDropdownOpen"
      @click="toggleDropdown"
      @blur="handleBlur"
    >
      <div class="avatar">
        {{ getInitials(currentUser.name) }}
      </div>
      <span class="profile-name">{{ currentUser.name }}</span>
      <svg
        class="chevron"
        :class="{ 'chevron-open': isDropdownOpen }"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
      >
        <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>

    <div v-if="isDropdownOpen" class="dropdown-menu">
      <div class="dropdown-header">
        <div class="avatar-large">
          {{ getInitials(currentUser.name) }}
        </div>
        <div class="user-info">
          <div class="user-name">{{ currentUser.name }}</div>
          <div class="user-email">{{ currentUser.email }}</div>
        </div>
      </div>

      <div class="dropdown-divider"></div>

      <button
        class="dropdown-item"
        @mousedown.prevent="showProfileDetails"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 9C10.6569 9 12 7.65685 12 6C12 4.34315 10.6569 3 9 3C7.34315 3 6 4.34315 6 6C6 7.65685 7.34315 9 9 9Z" stroke="currentColor" stroke-width="1.5"/>
          <path d="M15 15C15 12.7909 12.3137 11 9 11C5.68629 11 3 12.7909 3 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        {{ t('profile.profileDetails') }}
      </button>

      <button
        class="dropdown-item"
        @mousedown.prevent="showTasks"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M15 3H3C2.44772 3 2 3.44772 2 4V14C2 14.5523 2.44772 15 3 15H15C15.5523 15 16 14.5523 16 14V4C16 3.44772 15.5523 3 15 3Z" stroke="currentColor" stroke-width="1.5"/>
          <path d="M6 7L8 9L12 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        {{ t('profile.myTasks') }}
        <span v-if="pendingTaskCount > 0" class="task-badge">{{ pendingTaskCount }}</span>
      </button>

      <div class="dropdown-divider"></div>

      <button
        class="dropdown-item logout"
        @mousedown.prevent="handleLogout"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M7 15H4C3.44772 15 3 14.5523 3 14V4C3 3.44772 3.44772 3 4 3H7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M11 12L15 9M15 9L11 6M15 9H7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        {{ t('profile.logout') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useI18n } from '../composables/useI18n'

const { currentUser, logout, getInitials } = useAuth()
const { t } = useI18n()

defineProps({ compact: { type: Boolean, default: false } })

const isDropdownOpen = ref(false)
const emit = defineEmits(['show-profile-details', 'show-tasks'])

const pendingTaskCount = computed(() => {
  return currentUser.value.tasks.filter(task => task.status === 'pending').length
})

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

const handleBlur = () => {
  // Delay to allow mousedown events on dropdown items to fire first
  setTimeout(() => {
    isDropdownOpen.value = false
  }, 200)
}

const showProfileDetails = () => {
  isDropdownOpen.value = false
  emit('show-profile-details')
}

const showTasks = () => {
  isDropdownOpen.value = false
  emit('show-tasks')
}

const handleLogout = () => {
  isDropdownOpen.value = false
  logout()
}
</script>

<style scoped>
/* Sidebar footer control on graphite. Dropdown opens upward and aligns left. */
.profile-menu { position: relative; }

.profile-button {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  height: 44px;
  padding: 0 8px;
  background: transparent;
  border: 0;
  border-radius: var(--radius-control);
  cursor: pointer;
  transition: background 120ms ease;
  color: var(--graphite-300);
}
.profile-button:hover { background: var(--graphite-700); }
.profile-button:focus-visible { outline: 2px solid var(--info); outline-offset: 2px; }

.avatar {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-control);
  background: var(--steel-200);
  color: var(--ink);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;
  flex-shrink: 0;
}
.profile-name {
  flex: 1;
  text-align: left;
  font-size: 15px;
  font-weight: 500;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.chevron { flex-shrink: 0; transition: transform 120ms ease; transform: rotate(180deg); }
.chevron-open { transform: rotate(0deg); }

.is-compact .profile-button { justify-content: center; padding: 0; }
.is-compact .profile-name,
.is-compact .chevron { display: none; }

.dropdown-menu {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  min-width: 260px;
  max-width: calc(100vw - 32px);
  background: var(--panel);
  border: 1px solid var(--rule);
  border-radius: var(--radius-panel);
  box-shadow: var(--shadow-pop);
  z-index: 1000;
  overflow: hidden;
}
.dropdown-header {
  padding: 16px;
  display: flex;
  gap: 12px;
  align-items: center;
  background: var(--steel-100);
}
.avatar-large {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-control);
  background: var(--graphite-900);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 15px;
  flex-shrink: 0;
}
.user-info { flex: 1; min-width: 0; }
.user-name {
  font-family: var(--font-display);
  font-weight: 600;
  color: var(--ink);
  font-size: 17px;
  line-height: 1.2;
}
.user-email {
  font-size: 13px;
  color: var(--ink-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dropdown-divider { height: 1px; background: var(--rule); margin: 4px 0; }
.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  height: 40px;
  padding: 0 16px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background 120ms ease;
  font-size: 15px;
  font-weight: 500;
  color: var(--ink-body);
}
.dropdown-item:hover { background: var(--steel-100); }
.dropdown-item svg { color: var(--ink-muted); flex-shrink: 0; }
.dropdown-item.logout,
.dropdown-item.logout svg { color: var(--bad-ink); }
.dropdown-item.logout:hover { background: var(--bad-soft); }
.task-badge {
  margin-left: auto;
  background: var(--signal-soft);
  color: var(--signal-ink);
  font-size: 12px;
  font-weight: 600;
  padding: 0 8px;
  border-radius: var(--radius-badge);
  min-width: 20px;
  text-align: center;
}
</style>
