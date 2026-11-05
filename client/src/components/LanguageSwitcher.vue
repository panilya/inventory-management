<template>
  <div class="language-switcher" :class="{ 'is-compact': compact }">
    <button
      class="language-button"
      :title="compact ? localeName : undefined"
      :aria-label="localeName"
      aria-haspopup="menu"
      :aria-expanded="isDropdownOpen"
      @click="toggleDropdown"
      @blur="handleBlur"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        class="globe-icon"
      >
        <circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5"/>
        <path d="M3 10H17" stroke="currentColor" stroke-width="1.5"/>
        <path d="M10 3C10 3 7.5 5.5 7.5 10C7.5 14.5 10 17 10 17" stroke="currentColor" stroke-width="1.5"/>
        <path d="M10 3C10 3 12.5 5.5 12.5 10C12.5 14.5 10 17 10 17" stroke="currentColor" stroke-width="1.5"/>
      </svg>
      <span class="language-label">{{ localeName }}</span>
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
      <button
        v-for="locale in availableLocales"
        :key="locale"
        class="dropdown-item"
        :class="{ active: currentLocale === locale }"
        @mousedown.prevent="selectLanguage(locale)"
      >
        <span class="language-name">{{ getLanguageName(locale) }}</span>
        <svg
          v-if="currentLocale === locale"
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          class="check-icon"
        >
          <path d="M4 9L7.5 12.5L14 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from '../composables/useI18n'

const { currentLocale, setLocale, availableLocales, localeName } = useI18n()

defineProps({ compact: { type: Boolean, default: false } })

const isDropdownOpen = ref(false)

const languageNames = {
  en: 'English',
  ja: '日本語'
}

const getLanguageName = (locale) => {
  return languageNames[locale] || locale
}

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

const handleBlur = () => {
  // Delay to allow mousedown events on dropdown items to fire first
  setTimeout(() => {
    isDropdownOpen.value = false
  }, 200)
}

const selectLanguage = (locale) => {
  setLocale(locale)
  isDropdownOpen.value = false
}
</script>

<style scoped>
/* Sidebar footer control on graphite. Dropdown opens upward and aligns left. */
.language-switcher { position: relative; }

.language-button {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  height: 40px;
  padding: 0 12px;
  background: transparent;
  border: 0;
  border-radius: var(--radius-control);
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease;
  font-size: 15px;
  font-weight: 500;
  color: var(--graphite-300);
}
.language-button:hover { background: var(--graphite-700); color: #fff; }
.language-button:focus-visible { outline: 2px solid var(--info); outline-offset: 2px; }

.globe-icon { flex-shrink: 0; }
.language-label { flex: 1; text-align: left; white-space: nowrap; }
.chevron { flex-shrink: 0; transition: transform 120ms ease; transform: rotate(180deg); }
.chevron-open { transform: rotate(0deg); }

.is-compact .language-button { justify-content: center; padding: 0; }
.is-compact .language-label,
.is-compact .chevron { display: none; }

.dropdown-menu {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  min-width: 180px;
  background: var(--panel);
  border: 1px solid var(--rule);
  border-radius: var(--radius-panel);
  box-shadow: var(--shadow-pop);
  z-index: 1000;
  overflow: hidden;
  padding: 4px;
}
.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 36px;
  padding: 0 12px;
  background: none;
  border: none;
  border-radius: var(--radius-control);
  text-align: left;
  cursor: pointer;
  transition: background 120ms ease;
  font-size: 15px;
  font-weight: 500;
  color: var(--ink-body);
}
.dropdown-item:hover { background: var(--steel-100); }
.dropdown-item.active { background: var(--info-soft); color: var(--info-ink); }
.language-name { flex: 1; }
.check-icon { color: var(--info); flex-shrink: 0; }
</style>
