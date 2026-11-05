<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen && backlogItem" class="modal-overlay" @click="close">
        <div
          class="modal-container"
          role="dialog"
          aria-modal="true"
          aria-labelledby="po-modal-title"
          @click.stop
        >
          <div class="modal-header">
            <h3 id="po-modal-title" class="modal-title">
              {{ t(isView ? 'purchaseOrder.viewTitle' : 'purchaseOrder.createTitle') }}
            </h3>
            <button class="close-button" @click="close" :aria-label="t('common.close')">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <!-- View mode -->
          <template v-if="isView">
            <div class="modal-body">
              <div v-if="viewLoading" class="loading">{{ t('purchaseOrder.loading') }}</div>
              <div v-else-if="viewError" class="error" role="alert">{{ viewError }}</div>
              <template v-else-if="purchaseOrder">
                <div class="item-header">
                  <div class="item-title-section">
                    <h4 class="item-name">{{ translateProductName(backlogItem.item_name) }}</h4>
                    <div class="item-sku">{{ t('purchaseOrder.sku') }}: {{ backlogItem.item_sku }}</div>
                  </div>
                  <span class="badge" :class="statusClass">{{ statusLabel }}</span>
                </div>

                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">{{ t('purchaseOrder.supplier') }}</div>
                    <div class="info-value">{{ purchaseOrder.supplier_name }}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">{{ t('purchaseOrder.quantity') }}</div>
                    <div class="info-value">{{ purchaseOrder.quantity }}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">{{ t('purchaseOrder.unitCost') }}</div>
                    <div class="info-value">{{ formatUsd(purchaseOrder.unit_cost) }}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">{{ t('purchaseOrder.total') }}</div>
                    <div class="info-value">{{ formatUsd(purchaseOrder.quantity * purchaseOrder.unit_cost) }}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">{{ t('purchaseOrder.expectedDelivery') }}</div>
                    <div class="info-value">{{ formatDate(purchaseOrder.expected_delivery_date) }}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">{{ t('purchaseOrder.createdDate') }}</div>
                    <div class="info-value">{{ formatDate(purchaseOrder.created_date) }}</div>
                  </div>
                  <div class="info-item info-item-wide">
                    <div class="info-label">{{ t('purchaseOrder.notes') }}</div>
                    <div class="info-value notes-text">{{ purchaseOrder.notes || '-' }}</div>
                  </div>
                </div>
              </template>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn" @click="close">{{ t('common.close') }}</button>
            </div>
          </template>

          <!-- Create mode -->
          <form v-else novalidate class="po-form" @submit.prevent="submit">
            <div class="modal-body">
              <div class="item-header">
                <div class="item-title-section">
                  <h4 class="item-name">{{ translateProductName(backlogItem.item_name) }}</h4>
                  <div class="item-sku">{{ t('purchaseOrder.sku') }}: {{ backlogItem.item_sku }}</div>
                </div>
              </div>

              <div class="info-grid summary-info">
                <div class="info-item">
                  <div class="info-label">{{ t('purchaseOrder.orderId') }}</div>
                  <div class="info-value nowrap">{{ backlogItem.order_id }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">{{ t('purchaseOrder.shortage') }}</div>
                  <div class="info-value shortage-value">{{ t('purchaseOrder.units', { count: shortage }) }}</div>
                </div>
              </div>

              <div v-if="submitError" class="error" role="alert">{{ submitError }}</div>

              <div class="form-grid">
                <div class="field field-wide">
                  <label class="info-label" for="po-supplier">{{ t('purchaseOrder.supplier') }}</label>
                  <input
                    id="po-supplier"
                    ref="firstFieldRef"
                    v-model="form.supplier"
                    class="input"
                    type="text"
                    maxlength="120"
                    autocomplete="off"
                    :aria-invalid="!!errors.supplier"
                    aria-describedby="po-supplier-error"
                    @blur="touched.supplier = true"
                  />
                  <div v-if="errors.supplier" id="po-supplier-error" class="field-error">{{ errors.supplier }}</div>
                </div>

                <div class="field">
                  <label class="info-label" for="po-quantity">{{ t('purchaseOrder.quantity') }}</label>
                  <input
                    id="po-quantity"
                    v-model="form.quantity"
                    class="input"
                    type="number"
                    min="1"
                    step="1"
                    inputmode="numeric"
                    :aria-invalid="!!errors.quantity"
                    aria-describedby="po-quantity-error"
                    @blur="touched.quantity = true"
                  />
                  <div v-if="errors.quantity" id="po-quantity-error" class="field-error">{{ errors.quantity }}</div>
                </div>

                <div class="field">
                  <label class="info-label" for="po-unit-cost">{{ t('purchaseOrder.unitCost') }}</label>
                  <input
                    id="po-unit-cost"
                    v-model="form.unitCost"
                    class="input"
                    type="number"
                    min="0"
                    step="0.01"
                    inputmode="decimal"
                    :aria-invalid="!!errors.unitCost"
                    aria-describedby="po-unit-cost-error"
                    @blur="touched.unitCost = true"
                  />
                  <div v-if="errors.unitCost" id="po-unit-cost-error" class="field-error">{{ errors.unitCost }}</div>
                </div>

                <div class="field field-wide">
                  <label class="info-label" for="po-delivery">{{ t('purchaseOrder.expectedDelivery') }}</label>
                  <input
                    id="po-delivery"
                    v-model="form.deliveryDate"
                    class="input"
                    type="date"
                    :min="today"
                    :aria-invalid="!!errors.deliveryDate"
                    aria-describedby="po-delivery-error"
                    @blur="touched.deliveryDate = true"
                  />
                  <div v-if="errors.deliveryDate" id="po-delivery-error" class="field-error">{{ errors.deliveryDate }}</div>
                </div>

                <div class="field field-wide">
                  <label class="info-label" for="po-notes">{{ t('purchaseOrder.notesOptional') }}</label>
                  <textarea
                    id="po-notes"
                    v-model="form.notes"
                    class="input notes-input"
                    rows="3"
                    maxlength="500"
                  ></textarea>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn" @click="close">{{ t('common.cancel') }}</button>
              <button type="submit" class="btn btn-primary" :disabled="submitting">
                {{ t(submitting ? 'purchaseOrder.submitting' : 'purchaseOrder.submit') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { api } from '../api'
import { useI18n } from '../composables/useI18n'
import { formatCurrencyWithDecimals } from '../utils/currency'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  backlogItem: { type: Object, default: null },
  // 'create' shows the entry form, 'view' shows the existing PO
  mode: { type: String, default: 'create', validator: (v) => ['create', 'view'].includes(v) }
})

const emit = defineEmits(['close', 'po-created'])

const { t, translateProductName, intlLocale } = useI18n()

const isView = computed(() => props.mode === 'view')

const shortage = computed(() => {
  if (!props.backlogItem) return 0
  return Math.max(0, props.backlogItem.quantity_needed - props.backlogItem.quantity_available)
})

// API amounts are always USD, so PO money is shown in USD regardless of the UI locale
const formatUsd = (amount) => formatCurrencyWithDecimals(amount, 'USD', 2)

// Parses a YYYY-MM-DD string as a local date (new Date('YYYY-MM-DD') is UTC and can shift a day)
const parseLocalDate = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '')
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return isNaN(date.getTime()) ? null : date
}

const formatDate = (value) => {
  const date = parseLocalDate(value)
  if (!date) return value || '-'
  return date.toLocaleDateString(intlLocale.value, { year: 'numeric', month: 'long', day: 'numeric' })
}

// Today as a local YYYY-MM-DD string (toISOString would use UTC)
const todayString = () => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
// Recomputed on each open so a long-lived page does not keep a stale "today"
const today = ref(todayString())

// ---------- Create mode ----------
const firstFieldRef = ref(null)
const form = reactive({ supplier: '', quantity: '', unitCost: '', deliveryDate: '', notes: '' })
const touched = reactive({ supplier: false, quantity: false, unitCost: false, deliveryDate: false })
const showAllErrors = ref(false)
const submitting = ref(false)
const submitError = ref('')

const validators = {
  supplier: () => (form.supplier.trim() ? '' : t('purchaseOrder.errors.supplierRequired')),
  quantity: () => {
    const raw = String(form.quantity).trim()
    const n = Number(raw)
    return raw !== '' && Number.isInteger(n) && n > 0 ? '' : t('purchaseOrder.errors.quantityInvalid')
  },
  unitCost: () => {
    const raw = String(form.unitCost).trim()
    const n = Number(raw)
    return raw !== '' && Number.isFinite(n) && n >= 0 ? '' : t('purchaseOrder.errors.unitCostInvalid')
  },
  deliveryDate: () => {
    if (!form.deliveryDate) return t('purchaseOrder.errors.deliveryRequired')
    // ISO date strings compare correctly as plain strings
    return form.deliveryDate >= today.value ? '' : t('purchaseOrder.errors.deliveryPast')
  }
}

// Messages are only surfaced for fields the user has left, or for all fields after a submit attempt
const errors = computed(() => {
  const result = {}
  for (const key of Object.keys(validators)) {
    if (showAllErrors.value || touched[key]) result[key] = validators[key]()
  }
  return result
})

const resetForm = () => {
  form.supplier = ''
  form.quantity = shortage.value > 0 ? String(shortage.value) : ''
  form.unitCost = ''
  form.deliveryDate = ''
  form.notes = ''
  Object.keys(touched).forEach((k) => { touched[k] = false })
  showAllErrors.value = false
  submitting.value = false
  submitError.value = ''
  today.value = todayString()
}

const submit = async () => {
  if (submitting.value) return
  showAllErrors.value = true
  if (Object.keys(validators).some((key) => validators[key]())) return

  submitting.value = true
  submitError.value = ''
  try {
    const created = await api.createPurchaseOrder({
      backlog_item_id: props.backlogItem.id,
      supplier_name: form.supplier.trim(),
      quantity: Number(form.quantity),
      unit_cost: Number(form.unitCost),
      expected_delivery_date: form.deliveryDate,
      notes: form.notes.trim() || null
    })
    emit('po-created', created)
    emit('close')
  } catch (err) {
    const status = err.response?.status
    if (status === 409) submitError.value = t('purchaseOrder.errors.conflict')
    else if (status === 404) submitError.value = t('purchaseOrder.errors.notFound')
    else submitError.value = t('purchaseOrder.errors.generic')
    console.error(err)
  } finally {
    submitting.value = false
  }
}

// ---------- View mode ----------
const purchaseOrder = ref(null)
const viewLoading = ref(false)
const viewError = ref('')
// Only the latest fetch may write state (user can reopen for another item quickly)
let viewSeq = 0

const loadPurchaseOrder = async () => {
  const id = ++viewSeq
  purchaseOrder.value = null
  viewError.value = ''
  viewLoading.value = true
  try {
    const result = await api.getPurchaseOrderByBacklogItem(props.backlogItem.id)
    if (id === viewSeq) purchaseOrder.value = result
  } catch (err) {
    if (id === viewSeq) {
      viewError.value = err.response?.status === 404
        ? t('purchaseOrder.errors.noneFound')
        : t('purchaseOrder.errors.loadFailed')
      console.error(err)
    }
  } finally {
    if (id === viewSeq) viewLoading.value = false
  }
}

const statusClass = computed(() => {
  const map = { pending: 'warning', approved: 'info', ordered: 'info', received: 'success', cancelled: 'danger' }
  return map[purchaseOrder.value?.status] || 'stable'
})

const statusLabel = computed(() => {
  const status = purchaseOrder.value?.status
  if (!status) return ''
  const key = `purchaseOrder.status.${status}`
  const label = t(key)
  // t() returns the key when missing; fall back to the raw status from the API
  return label === key ? status : label
})

// ---------- Open / close ----------
const close = () => emit('close')

const onKeydown = (event) => {
  if (event.key === 'Escape') close()
}

watch(
  () => [props.isOpen, props.backlogItem?.id, props.mode],
  async ([open]) => {
    if (!open || !props.backlogItem) return
    if (isView.value) {
      loadPurchaseOrder()
    } else {
      resetForm()
      // Wait for the Teleport/Transition content to render before focusing
      await nextTick()
      firstFieldRef.value?.focus()
    }
  },
  { immediate: true }
)

// Esc listener only lives while the modal is open
watch(
  () => props.isOpen,
  (open) => {
    if (open) window.addEventListener('keydown', onKeydown)
    else window.removeEventListener('keydown', onKeydown)
  },
  { immediate: true }
)

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
/* Shared modal family styles (kept identical across the modals). */
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

/* Identity header: name and SKU (plus status badge in view mode) */
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

/* Fade only (no entrance motion), <= 150ms */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.15s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* ---- Purchase order specific ---- */
/* The form wraps body + footer; keep the flex column so the body scrolls and footer stays pinned */
.po-form {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.summary-info {
  margin-bottom: 24px;
}

.shortage-value {
  color: var(--bad-ink);
  font-weight: 600;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 24px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.field-wide,
.info-item-wide {
  grid-column: 1 / -1;
}

.notes-input {
  height: auto;
  padding: 8px 12px;
  font-family: inherit;
  resize: vertical;
}

.notes-text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.field-error {
  font-size: 13px;
  color: var(--bad-ink);
}

.input[aria-invalid="true"] {
  border-color: var(--bad);
}

.error {
  margin: 0 0 16px 0;
}

@media (max-width: 520px) {
  .form-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
