<template>
  <div class="filters-bar">
    <!-- Mobile only: filters collapse behind this toggle (UI state only, no filter logic). -->
    <button
      class="filters-toggle"
      type="button"
      :aria-expanded="panelOpen"
      aria-controls="filters-panel"
      @click="panelOpen = !panelOpen"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true">
        <path d="M3 5h18M6 12h12M10 19h4" />
      </svg>
      {{ t('filters.title') }}
      <span v-if="hasActiveFilters" class="filters-dot" aria-hidden="true"></span>
    </button>

    <div id="filters-panel" class="filters-container" :class="{ 'is-open': panelOpen }">
      <div class="filters-grid">
        <div class="filter-group">
          <label>{{ t('filters.timePeriod') }}</label>
          <select v-model="selectedPeriod" class="filter-select">
            <option value="all">{{ t('filters.allMonths') }}</option>
            <option value="2025-01">{{ t('months.january') }}</option>
            <option value="2025-02">{{ t('months.february') }}</option>
            <option value="2025-03">{{ t('months.march') }}</option>
            <option value="2025-04">{{ t('months.april') }}</option>
            <option value="2025-05">{{ t('months.may') }}</option>
            <option value="2025-06">{{ t('months.june') }}</option>
            <option value="2025-07">{{ t('months.july') }}</option>
            <option value="2025-08">{{ t('months.august') }}</option>
            <option value="2025-09">{{ t('months.september') }}</option>
            <option value="2025-10">{{ t('months.october') }}</option>
            <option value="2025-11">{{ t('months.november') }}</option>
            <option value="2025-12">{{ t('months.december') }}</option>
          </select>
        </div>

        <div class="filter-group">
          <label>{{ t('filters.location') }}</label>
          <select v-model="selectedLocation" class="filter-select">
            <option value="all">{{ t('filters.all') }}</option>
            <option value="San Francisco">{{ t('warehouses.sanFrancisco') }}</option>
            <option value="London">{{ t('warehouses.london') }}</option>
            <option value="Tokyo">{{ t('warehouses.tokyo') }}</option>
          </select>
        </div>

        <div class="filter-group">
          <label>{{ t('filters.category') }}</label>
          <select v-model="selectedCategory" class="filter-select">
            <option value="all">{{ t('filters.all') }}</option>
            <option value="circuit boards">{{ t('categories.circuitBoards') }}</option>
            <option value="sensors">{{ t('categories.sensors') }}</option>
            <option value="actuators">{{ t('categories.actuators') }}</option>
            <option value="controllers">{{ t('categories.controllers') }}</option>
            <option value="power supplies">{{ t('categories.powerSupplies') }}</option>
          </select>
        </div>

        <div class="filter-group">
          <label>{{ t('filters.orderStatus') }}</label>
          <select v-model="selectedStatus" class="filter-select">
            <option value="all">{{ t('filters.all') }}</option>
            <option value="delivered">{{ t('status.delivered') }}</option>
            <option value="shipped">{{ t('status.shipped') }}</option>
            <option value="processing">{{ t('status.processing') }}</option>
            <option value="backordered">{{ t('status.backordered') }}</option>
          </select>
        </div>
      </div>

      <button
        class="reset-filters-btn"
        @click="resetFilters"
        :disabled="!hasActiveFilters"
        :title="t('filters.reset')"
        :aria-label="t('filters.reset')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useFilters } from '../composables/useFilters'
import { useI18n } from '../composables/useI18n'

export default {
  name: 'FilterBar',
  setup() {
    const {
      selectedPeriod,
      selectedLocation,
      selectedCategory,
      selectedStatus,
      hasActiveFilters,
      resetFilters
    } = useFilters()

    const { t } = useI18n()
    const panelOpen = ref(false)

    return {
      t,
      panelOpen,
      selectedPeriod,
      selectedLocation,
      selectedCategory,
      selectedStatus,
      hasActiveFilters,
      resetFilters
    }
  }
}
</script>

<style scoped>
/* Lives inside the white topbar (see App.vue). Compact 36px controls, sentence-case labels. */
.filters-bar {
  flex: 1;
  min-width: 0;
  display: flex;
  justify-content: flex-end;
}
.filters-toggle { display: none; }

.filters-container {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.filters-grid {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 16px;
  flex: 1;
}
.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.filter-group label {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-muted);
  white-space: nowrap;
}
.filter-select {
  height: 36px;
  padding: 0 28px 0 10px;
  border: 1px solid var(--rule);
  border-radius: var(--radius-control);
  font-size: 14px;
  font-weight: 500;
  color: var(--ink);
  background-color: var(--panel);
  cursor: pointer;
  min-width: 120px;
  transition: border-color 120ms ease;
}
.filter-select:hover { border-color: var(--graphite-300); }

.reset-filters-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--panel);
  border: 1px solid var(--rule);
  border-radius: var(--radius-control);
  color: var(--ink-muted);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 120ms ease, color 120ms ease;
}
.reset-filters-btn:hover:not(:disabled) {
  background: var(--steel-100);
  color: var(--ink);
}
.reset-filters-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.reset-filters-btn svg {
  width: 16px;
  height: 16px;
}

@media (max-width: 767.98px) {
  .filters-toggle {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 36px;
    padding: 0 12px;
    margin-left: auto;
    border: 1px solid var(--rule);
    border-radius: var(--radius-control);
    background: var(--panel);
    color: var(--ink);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }
  .filters-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--signal);
  }
  /* Panel drops under the topbar (which is the positioned ancestor via sticky). */
  .filters-container {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    padding: 12px 16px 16px;
    background: var(--panel);
    border-bottom: 1px solid var(--rule);
    align-items: flex-end;
  }
  .filters-container.is-open { display: flex; }
  .filters-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .filter-group {
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
  }
  .filter-select { min-width: 0; width: 100%; }
  .reset-filters-btn { width: 36px; }
}
</style>
