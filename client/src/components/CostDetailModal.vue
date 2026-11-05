<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen && costData" class="modal-overlay" @click="close">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">{{ costData.month }} Cost Breakdown</h3>
            <button class="close-button" @click="close" aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="cost-summary">
              <div class="summary-card primary">
                <div class="summary-label">Total costs</div>
                <div class="summary-value">{{ formatCurrency(totalCosts, currentCurrency) }}</div>
              </div>
            </div>

            <div class="cost-breakdown">
              <div class="cost-item procurement">
                <div class="cost-header">
                  <div class="cost-info">
                    <div class="cost-name">Procurement</div>
                    <div class="cost-amount">{{ formatCurrency(costData.procurement, currentCurrency) }}</div>
                  </div>
                </div>
                <div class="cost-percentage">{{ getProcurementPercentage() }}% of total</div>
              </div>

              <div class="cost-item operational">
                <div class="cost-header">
                  <div class="cost-info">
                    <div class="cost-name">Operational</div>
                    <div class="cost-amount">{{ formatCurrency(costData.operational, currentCurrency) }}</div>
                  </div>
                </div>
                <div class="cost-percentage">{{ getOperationalPercentage() }}% of total</div>
              </div>

              <div class="cost-item labor">
                <div class="cost-header">
                  <div class="cost-info">
                    <div class="cost-name">Labor</div>
                    <div class="cost-amount">{{ formatCurrency(costData.labor, currentCurrency) }}</div>
                  </div>
                </div>
                <div class="cost-percentage">{{ getLaborPercentage() }}% of total</div>
              </div>

              <div class="cost-item overhead">
                <div class="cost-header">
                  <div class="cost-info">
                    <div class="cost-name">Overhead</div>
                    <div class="cost-amount">{{ formatCurrency(costData.overhead, currentCurrency) }}</div>
                  </div>
                </div>
                <div class="cost-percentage">{{ getOverheadPercentage() }}% of total</div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn" @click="close">Close</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '../composables/useI18n'
import { formatCurrency } from '../utils/currency'

const { currentCurrency } = useI18n()


const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  costData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close'])

const totalCosts = computed(() => {
  if (!props.costData) return 0
  return props.costData.procurement + props.costData.operational +
         props.costData.labor + props.costData.overhead
})

const getProcurementPercentage = () => {
  if (!props.costData || totalCosts.value === 0) return 0
  return ((props.costData.procurement / totalCosts.value) * 100).toFixed(1)
}

const getOperationalPercentage = () => {
  if (!props.costData || totalCosts.value === 0) return 0
  return ((props.costData.operational / totalCosts.value) * 100).toFixed(1)
}

const getLaborPercentage = () => {
  if (!props.costData || totalCosts.value === 0) return 0
  return ((props.costData.labor / totalCosts.value) * 100).toFixed(1)
}

const getOverheadPercentage = () => {
  if (!props.costData || totalCosts.value === 0) return 0
  return ((props.costData.overhead / totalCosts.value) * 100).toFixed(1)
}

const close = () => {
  emit('close')
}
</script>

<style scoped>
/* Shared modal family styles (kept identical across the six modals). */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(28, 33, 39, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 16px; /* 16px viewport margin on mobile */
}

.modal-container {
  background: var(--panel);
  border-radius: var(--radius-panel);
  box-shadow: var(--shadow-pop);
  max-width: 600px;
  width: 100%;
  max-height: calc(100vh - 32px);
  max-height: calc(100dvh - 32px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 24px;
  border-bottom: 1px solid var(--rule);
}

.modal-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 600;
  line-height: 28px;
  letter-spacing: -0.005em;
  color: var(--ink);
}

.close-button {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: var(--radius-control);
  color: var(--ink-muted);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.close-button:hover {
  background: var(--steel-100);
  color: var(--ink);
}

.modal-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid var(--rule);
}

/* Detail rows: muted label over tabular value, 16px row / 24px column gaps */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(200px, 100%), 1fr));
  gap: 16px 24px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-muted);
}

.info-value {
  font-size: 15px;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

/* Identity header: name, SKU and status badge */
.item-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--rule);
  margin-bottom: 24px;
}

.item-title-section {
  flex: 1;
  min-width: 0;
}

.item-name {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--ink);
}

.item-sku {
  font-size: 13px;
  color: var(--ink-muted);
  font-variant-numeric: tabular-nums;
}

.status-pill {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: var(--radius-badge);
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
  background: var(--steel-200);
  color: var(--ink-body);
}

.status-pill.success, .status-pill.completed { background: var(--ok-soft); color: var(--ok-ink); }
.status-pill.warning, .status-pill.medium, .status-pill.urgent { background: var(--signal-soft); color: var(--signal-ink); }
.status-pill.danger, .status-pill.high, .status-pill.overdue { background: var(--bad-soft); color: var(--bad-ink); }
.status-pill.info, .status-pill.low, .status-pill.upcoming { background: var(--info-soft); color: var(--info-ink); }

/* Summary tiles: flat panel with a 3px left status rule */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  padding: 16px;
  border: 1px solid var(--rule);
  border-left: 3px solid var(--ink-muted);
  border-radius: var(--radius-panel);
  background: var(--steel-100);
}

.summary-card.danger { border-left-color: var(--bad); }
.summary-card.warning { border-left-color: var(--signal); }
.summary-card.success { border-left-color: var(--ok); }
.summary-card.primary { border-left-color: var(--info); }

.summary-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-muted);
  margin-bottom: 4px;
}

.summary-value {
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 600;
  line-height: 32px;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.summary-card.danger .summary-value { color: var(--bad-ink); }
.summary-card.warning .summary-value { color: var(--signal-ink); }
.summary-card.success .summary-value { color: var(--ok-ink); }

.summary-subtitle {
  font-size: 12px;
  color: var(--ink-muted);
  margin-top: 4px;
}

/* Fade only (no entrance motion), <= 150ms */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.15s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.cost-summary {
  margin-bottom: 24px;
}

.cost-breakdown {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* One flat row per cost category; the 3px left rule carries the category color */
.cost-item {
  padding: 16px;
  border: 1px solid var(--rule);
  border-left: 3px solid var(--ink-muted);
  border-radius: var(--radius-panel);
  background: var(--panel);
}

.cost-item.procurement { border-left-color: var(--info); }
.cost-item.operational { border-left-color: var(--ink-muted); }
.cost-item.labor { border-left-color: var(--ok); }
.cost-item.overhead { border-left-color: var(--signal); }

.cost-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 4px;
}

.cost-info {
  flex: 1;
}

.cost-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-muted);
  margin-bottom: 4px;
}

.cost-amount {
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 600;
  line-height: 32px;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.cost-percentage {
  font-size: 13px;
  color: var(--ink-muted);
  font-variant-numeric: tabular-nums;
}
</style>
