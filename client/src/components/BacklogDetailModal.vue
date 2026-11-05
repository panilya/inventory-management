<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen && backlogItem" class="modal-overlay" @click="close">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">Inventory shortage details</h3>
            <button class="close-button" @click="close" aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="item-header">
              <div class="item-title-section">
                <h4 class="item-name">{{ translateProductName(backlogItem.item_name) }}</h4>
                <div class="item-sku">SKU: {{ backlogItem.item_sku }}</div>
              </div>
              <span class="status-pill" :class="backlogItem.priority">
                {{ priorityLabel }} priority
              </span>
            </div>

            <div class="summary-grid">
              <div class="summary-card danger">
                <div class="summary-label">Shortage amount</div>
                <div class="summary-value">{{ shortage }} units</div>
              </div>
              <div class="summary-card warning">
                <div class="summary-label">Days delayed</div>
                <div class="summary-value">{{ backlogItem.days_delayed }} days</div>
              </div>
            </div>

            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Order ID</div>
                <div class="info-value nowrap">{{ backlogItem.order_id }}</div>
              </div>

              <div class="info-item">
                <div class="info-label">Item SKU</div>
                <div class="info-value nowrap">{{ backlogItem.item_sku }}</div>
              </div>

              <div class="info-item">
                <div class="info-label">Quantity needed</div>
                <div class="info-value">{{ backlogItem.quantity_needed }} units</div>
              </div>

              <div class="info-item">
                <div class="info-label">Quantity available</div>
                <div class="info-value">{{ backlogItem.quantity_available }} units</div>
              </div>

              <div class="info-item">
                <div class="info-label">Expected date</div>
                <div class="info-value">{{ formatDate(backlogItem.expected_date) }}</div>
              </div>

              <div class="info-item">
                <div class="info-label">Status</div>
                <div class="info-value">
                  <span class="badge danger">Backordered</span>
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

const { t, translateProductName, intlLocale } = useI18n()

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  backlogItem: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close'])

// Priority arrives lowercase from the API; show the translated label
const priorityLabel = computed(() => {
  const p = props.backlogItem?.priority
  return ['high', 'medium', 'low'].includes(p) ? t(`priority.${p}`) : (p || '')
})

const shortage = computed(() => {
  if (!props.backlogItem) return 0
  return props.backlogItem.quantity_needed - props.backlogItem.quantity_available
})

const close = () => {
  emit('close')
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString(intlLocale.value, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
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
</style>
