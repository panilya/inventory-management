<template>
  <div class="orders">
    <div class="page-header">
      <h2>{{ t('orders.title') }}</h2>
      <p>{{ t('orders.description') }}</p>
    </div>

    <div v-if="loading" class="loading">{{ t('common.loading') }}</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <div class="stats-grid">
        <div class="stat-card success">
          <div class="stat-label">{{ t('status.delivered') }}</div>
          <div class="stat-value">{{ getOrdersByStatus('Delivered').length }}</div>
        </div>
        <div class="stat-card info">
          <div class="stat-label">{{ t('status.shipped') }}</div>
          <div class="stat-value">{{ getOrdersByStatus('Shipped').length }}</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-label">{{ t('status.processing') }}</div>
          <div class="stat-value">{{ getOrdersByStatus('Processing').length }}</div>
        </div>
        <div class="stat-card danger">
          <div class="stat-label">{{ t('status.backordered') }}</div>
          <div class="stat-value">{{ getOrdersByStatus('Backordered').length }}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">{{ t('orders.allOrders') }} ({{ orders.length }})</h3>
        </div>
        <div class="table-container">
          <table class="orders-table">
            <thead>
              <tr>
                <th class="col-order-number">{{ t('orders.table.orderNumber') }}</th>
                <th class="col-customer">{{ t('orders.table.customer') }}</th>
                <th class="col-items">{{ t('orders.table.items') }}</th>
                <th class="col-status">{{ t('orders.table.status') }}</th>
                <th class="col-date nowrap">{{ t('orders.table.orderDate') }}</th>
                <th class="col-date nowrap">{{ t('orders.table.expectedDelivery') }}</th>
                <th class="col-value num">{{ t('orders.table.totalValue') }}</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="order in orders" :key="order.id">
                <tr :class="{ 'row-open': isExpanded(order.id) }">
                  <td class="col-order-number nowrap"><strong>{{ order.order_number }}</strong></td>
                  <td class="col-customer">{{ translateCustomerName(order.customer) }}</td>
                  <td class="col-items">
                    <button
                      type="button"
                      class="items-toggle"
                      :aria-expanded="isExpanded(order.id)"
                      @click="toggleItems(order.id)"
                    >
                      <svg class="chev" viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3l5 5-5 5" /></svg>
                      {{ itemsLabel(order.items.length) }}
                    </button>
                  </td>
                  <td class="col-status">
                    <span :class="['badge', getOrderStatusClass(order.status)]">
                      {{ t(`status.${order.status.toLowerCase()}`) }}
                    </span>
                  </td>
                  <td class="col-date nowrap">{{ formatDate(order.order_date) }}</td>
                  <td class="col-date nowrap">{{ formatDate(order.expected_delivery) }}</td>
                  <td class="col-value num nowrap"><strong>{{ currencySymbol }}{{ order.total_value.toLocaleString() }}</strong></td>
                </tr>
                <!-- Expanded detail row: part of the table flow, so it can never be clipped by the scroll container -->
                <tr v-if="isExpanded(order.id)" class="items-row">
                  <td colspan="7">
                    <div class="items-list">
                      <div v-for="(item, idx) in order.items" :key="`${order.id}-${idx}`" class="item-entry">
                        <span class="item-name">{{ translateProductName(item.name) }}</span>
                        <span class="item-meta">{{ t('orders.quantity') }}: {{ item.quantity }} @ {{ currencySymbol }}{{ item.unit_price }}</span>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, computed } from 'vue'
import { api } from '../api'
import { useFilters } from '../composables/useFilters'
import { useI18n } from '../composables/useI18n'

export default {
  name: 'Orders',
  setup() {
    const { t, currentCurrency, translateProductName, translateCustomerName } = useI18n()

    const currencySymbol = computed(() => {
      return currentCurrency.value === 'JPY' ? '¥' : '$'
    })
    const loading = ref(true)
    const error = ref(null)
    const orders = ref([])

    // Use shared filters
    const {
      selectedPeriod,
      selectedLocation,
      selectedCategory,
      selectedStatus,
      getCurrentFilters
    } = useFilters()

    const loadOrders = async () => {
      try {
        loading.value = true
        const filters = getCurrentFilters()
        const fetchedOrders = await api.getOrders(filters)

        // Sort orders by order_date (earliest first)
        orders.value = fetchedOrders.sort((a, b) => {
          const dateA = new Date(a.order_date)
          const dateB = new Date(b.order_date)
          return dateA - dateB
        })
      } catch (err) {
        error.value = 'Failed to load orders: ' + err.message
      } finally {
        loading.value = false
      }
    }

    // Watch for filter changes and reload data
    watch([selectedPeriod, selectedLocation, selectedCategory, selectedStatus], () => {
      loadOrders()
    })

    const itemsLabel = (count) => t(count === 1 ? 'orders.itemsCountOne' : 'orders.itemsCount', { count })

    // UI-only state: ids of orders whose item list is expanded
    const expandedIds = ref([])
    const isExpanded = (id) => expandedIds.value.includes(id)
    const toggleItems = (id) => {
      expandedIds.value = isExpanded(id)
        ? expandedIds.value.filter(x => x !== id)
        : [...expandedIds.value, id]
    }

    const getOrdersByStatus = (status) => {
      return orders.value.filter(order => order.status === status)
    }

    const getOrderStatusClass = (status) => {
      const statusMap = {
        'Delivered': 'success',
        'Shipped': 'info',
        'Processing': 'warning',
        'Backordered': 'danger'
      }
      return statusMap[status] || 'info'
    }

    const formatDate = (dateString) => {
      const { currentLocale } = useI18n()
      const locale = currentLocale.value === 'ja' ? 'ja-JP' : 'en-US'
      return new Date(dateString).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    onMounted(loadOrders)

    return {
      t,
      loading,
      error,
      orders,
      itemsLabel,
      isExpanded,
      toggleItems,
      getOrdersByStatus,
      getOrderStatusClass,
      formatDate,
      currencySymbol,
      translateProductName,
      translateCustomerName
    }
  }
}
</script>

<style scoped>
/* Fixed layout keeps columns stable when an item list expands; the table
   scrolls inside its panel on narrow screens (min-width below). */
.orders-table {
  table-layout: fixed;
  width: 100%;
  min-width: 860px;
}

.col-order-number { width: 130px; }
.col-customer { width: 180px; }
.col-items { width: 150px; }
.col-status { width: 120px; }
.col-date { width: 130px; }
.col-value { width: 110px; }

.items-toggle {
  appearance: none;
  background: none;
  border: 0;
  padding: 0;
  font: inherit;
  cursor: pointer;
  color: var(--info-ink);
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.items-toggle:hover {
  text-decoration: underline;
}

.chev {
  transition: transform 0.12s;
}

.items-toggle[aria-expanded='true'] .chev {
  transform: rotate(90deg);
}

.items-row > td {
  background: var(--steel-100);
  padding: 4px 16px 12px 40px;
}

.items-list {
  max-width: 480px;
}

.item-entry {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  border-bottom: 1px solid var(--rule);
}

.item-entry:last-child {
  border-bottom: none;
}

.item-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
}

.item-meta {
  font-size: 13px;
  color: var(--ink-muted);
}
</style>
