<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen && inventoryItem" class="modal-overlay" @click="close">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">Inventory item details</h3>
            <button class="close-button" @click="close" aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="item-header">
              <div class="item-title-section">
                <h4 class="item-name">{{ translateProductName(inventoryItem.name) }}</h4>
                <div class="item-sku">SKU: {{ inventoryItem.sku }}</div>
              </div>
              <span class="status-pill" :class="getStockStatusClass()">
                {{ getStockStatus() }}
              </span>
            </div>

            <div class="summary-grid">
              <div class="summary-card primary">
                <div class="summary-label">Quantity on Hand</div>
                <div class="summary-value">{{ inventoryItem.quantity_on_hand }} units</div>
              </div>
              <div class="summary-card" :class="getStockStatusClass()">
                <div class="summary-label">Stock level</div>
                <div class="summary-value">{{ stockPercentage }}%</div>
                <div class="summary-subtitle">vs. reorder point</div>
              </div>
            </div>

            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Category</div>
                <div class="info-value">{{ inventoryItem.category }}</div>
              </div>

              <div class="info-item">
                <div class="info-label">Location</div>
                <div class="info-value">{{ inventoryItem.location }}</div>
              </div>

              <div class="info-item">
                <div class="info-label">Reorder point</div>
                <div class="info-value">{{ inventoryItem.reorder_point }} units</div>
              </div>

              <div class="info-item">
                <div class="info-label">Units remaining</div>
                <div class="info-value">
                  <span :style="{ color: inventoryItem.quantity_on_hand <= inventoryItem.reorder_point ? 'var(--bad-ink)' : 'var(--ok-ink)' }">
                    {{ inventoryItem.quantity_on_hand - inventoryItem.reorder_point }} units
                  </span>
                </div>
              </div>

              <div class="info-item">
                <div class="info-label">Unit cost</div>
                <div class="info-value">{{ formatCurrencyWithDecimals(inventoryItem.unit_cost, currentCurrency, 2) }}</div>
              </div>

              <div class="info-item">
                <div class="info-label">Total value</div>
                <div class="info-value total-value">
                  {{ formatCurrencyWithDecimals(totalValue, currentCurrency, 2) }}
                </div>
              </div>

              <div class="info-item">
                <div class="info-label">Warehouse</div>
                <div class="info-value">{{ translateWarehouse(inventoryItem.location) }}</div>
              </div>

              <div class="info-item">
                <div class="info-label">Status</div>
                <div class="info-value">
                  <span :class="['badge', getStockStatusClass()]">
                    {{ getStockStatus() }}
                  </span>
                </div>
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
import { formatCurrencyWithDecimals } from '../utils/currency'

const { currentCurrency, translateProductName, translateWarehouse } = useI18n()


const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  inventoryItem: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close'])

const totalValue = computed(() => {
  if (!props.inventoryItem) return 0
  return props.inventoryItem.quantity_on_hand * props.inventoryItem.unit_cost
})

const stockPercentage = computed(() => {
  if (!props.inventoryItem || props.inventoryItem.reorder_point === 0) return 0
  return Math.round((props.inventoryItem.quantity_on_hand / props.inventoryItem.reorder_point) * 100)
})

const close = () => {
  emit('close')
}

const getStockStatus = () => {
  if (!props.inventoryItem) return 'Unknown'
  if (props.inventoryItem.quantity_on_hand <= props.inventoryItem.reorder_point) {
    return 'Low Stock'
  } else if (props.inventoryItem.quantity_on_hand <= props.inventoryItem.reorder_point * 1.5) {
    return 'Adequate'
  } else {
    return 'In Stock'
  }
}

const getStockStatusClass = () => {
  const status = getStockStatus()
  if (status === 'Low Stock') return 'danger'
  if (status === 'Adequate') return 'warning'
  return 'success'
}

const getStockIconClass = () => {
  const status = getStockStatus()
  if (status === 'Low Stock') return 'danger-icon'
  if (status === 'Adequate') return 'warning-icon'
  return 'success-icon'
}

const getSummaryCardClass = () => {
  const status = getStockStatus()
  if (status === 'Low Stock') return 'danger-card'
  if (status === 'Adequate') return 'warning-card'
  return 'success-card'
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
  max-width: 700px;
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

.info-value.total-value {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 600;
}
</style>
