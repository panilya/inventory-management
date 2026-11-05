<template>
  <div class="demand">
    <div class="page-header">
      <h2>{{ t('demand.title') }}</h2>
      <p>{{ t('demand.description') }}</p>
    </div>

    <div v-if="loading" class="loading">{{ t('common.loading') }}</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <div class="demand-trend-cards">
        <div class="card trend-card increasing-card">
          <div class="card-header">
            <h3 class="card-title"><span class="trend-dot" aria-hidden="true"></span>{{ t('demand.increasingDemand') }}</h3>
            <span class="card-meta">{{ itemsLabel(getForecastsByTrend('increasing').length) }}</span>
          </div>
          <div class="panel-body trend-items">
            <div v-for="item in getForecastsByTrend('increasing').slice(0, 5)" :key="item.id" class="trend-item">
              <span class="item-name">{{ item.item_name }}</span>
              <span class="item-change num">{{ getChangePercent(item) }}%</span>
            </div>
            <div v-if="getForecastsByTrend('increasing').length > 5" class="more-items">
              +{{ getForecastsByTrend('increasing').length - 5 }} {{ t('demand.more') }}
            </div>
          </div>
        </div>

        <div class="card trend-card stable-card">
          <div class="card-header">
            <h3 class="card-title"><span class="trend-dot" aria-hidden="true"></span>{{ t('demand.stableDemand') }}</h3>
            <span class="card-meta">{{ itemsLabel(getForecastsByTrend('stable').length) }}</span>
          </div>
          <div class="panel-body trend-items">
            <div v-for="item in getForecastsByTrend('stable').slice(0, 5)" :key="item.id" class="trend-item">
              <span class="item-name">{{ item.item_name }}</span>
              <span class="item-change num">{{ getChangePercent(item) }}%</span>
            </div>
            <div v-if="getForecastsByTrend('stable').length > 5" class="more-items">
              +{{ getForecastsByTrend('stable').length - 5 }} {{ t('demand.more') }}
            </div>
          </div>
        </div>

        <div class="card trend-card decreasing-card">
          <div class="card-header">
            <h3 class="card-title"><span class="trend-dot" aria-hidden="true"></span>{{ t('demand.decreasingDemand') }}</h3>
            <span class="card-meta">{{ itemsLabel(getForecastsByTrend('decreasing').length) }}</span>
          </div>
          <div class="panel-body trend-items">
            <div v-for="item in getForecastsByTrend('decreasing').slice(0, 5)" :key="item.id" class="trend-item">
              <span class="item-name">{{ item.item_name }}</span>
              <span class="item-change num">{{ getChangePercent(item) }}%</span>
            </div>
            <div v-if="getForecastsByTrend('decreasing').length > 5" class="more-items">
              +{{ getForecastsByTrend('decreasing').length - 5 }} {{ t('demand.more') }}
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">{{ t('demand.demandForecasts') }}</h3>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>{{ t('demand.table.sku') }}</th>
                <th>{{ t('demand.table.itemName') }}</th>
                <th class="num">{{ t('demand.table.currentDemand') }}</th>
                <th class="num">{{ t('demand.table.forecastedDemand') }}</th>
                <th class="num">{{ t('demand.table.change') }}</th>
                <th>{{ t('demand.table.trend') }}</th>
                <th>{{ t('demand.table.period') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="forecast in forecasts" :key="forecast.id">
                <td class="nowrap"><strong>{{ forecast.item_sku }}</strong></td>
                <td>{{ forecast.item_name }}</td>
                <td class="num">{{ forecast.current_demand }}</td>
                <td class="num"><strong>{{ forecast.forecasted_demand }}</strong></td>
                <td class="num">
                  <span :style="{ color: getChangeColor(forecast) }">
                    {{ getChangePercent(forecast) }}%
                  </span>
                </td>
                <td>
                  <span :class="['badge', forecast.trend]">
                    {{ t(`trends.${forecast.trend}`) }}
                  </span>
                </td>
                <td class="nowrap">{{ translatePeriod(forecast.period) }}</td>
              </tr>
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
  name: 'Demand',
  setup() {
    const { t, currentLocale } = useI18n()
    const loading = ref(true)
    const error = ref(null)
    const allForecasts = ref([])
    const inventoryItems = ref([])

    // Use shared filters
    const { selectedLocation, selectedCategory, getCurrentFilters } = useFilters()

    // Filter forecasts based on inventory filters
    const forecasts = computed(() => {
      if (selectedLocation.value === 'all' && selectedCategory.value === 'all') {
        return allForecasts.value
      }

      // Get SKUs of items that match the filters
      const validSkus = new Set(inventoryItems.value.map(item => item.sku))
      return allForecasts.value.filter(f => validSkus.has(f.item_sku))
    })

    const loadForecasts = async () => {
      try {
        loading.value = true
        const filters = getCurrentFilters()

        const [forecastsData, inventoryData] = await Promise.all([
          api.getDemandForecasts(),
          api.getInventory({
            warehouse: filters.warehouse,
            category: filters.category
          })
        ])

        allForecasts.value = forecastsData
        inventoryItems.value = inventoryData
      } catch (err) {
        error.value = 'Failed to load demand forecasts: ' + err.message
      } finally {
        loading.value = false
      }
    }

    // Watch for filter changes and reload data
    watch([selectedLocation, selectedCategory], () => {
      loadForecasts()
    })

    // Singular/plural card meta ("1 item" vs "3 items")
    const itemsLabel = (count) => t(count === 1 ? 'demand.itemsCountOne' : 'demand.itemsCount', { count })

    const getForecastsByTrend = (trend) => {
      return forecasts.value.filter(f => f.trend === trend)
    }

    const getChangePercent = (forecast) => {
      const change = ((forecast.forecasted_demand - forecast.current_demand) / forecast.current_demand * 100).toFixed(1)
      return change > 0 ? `+${change}` : change
    }

    const getChangeColor = (forecast) => {
      const change = forecast.forecasted_demand - forecast.current_demand
      const changePercent = Math.abs((change / forecast.current_demand) * 100)

      // If change is within ±2%, consider it stable and show blue
      if (changePercent <= 2) {
        return '#2D6CB5' // --info for stable
      }

      if (change > 0) return '#1E6140' // --ok-ink for increasing
      if (change < 0) return '#8F2A1E' // --bad-ink for decreasing
      return '#2D6CB5' // --info for no change
    }

    const translatePeriod = (period) => {
      // Period values like "Next 3 months", "Q1 2025", "30 days", etc.
      if (currentLocale.value === 'ja') {
        return period
          .replace(/Next\s+/i, '次の')
          .replace(/\s+months/i, 'か月')
          .replace(/\s+month/i, 'か月')
          .replace(/\s+days/i, '日間')
          .replace(/\s+day/i, '日')
          .replace('Q1', '第1四半期')
          .replace('Q2', '第2四半期')
          .replace('Q3', '第3四半期')
          .replace('Q4', '第4四半期')
      }
      if (currentLocale.value === 'de') {
        // "Next 30 days" -> "Nächste 30 Tage"; quarter labels (Q1 2025) are identical in German
        return period
          .replace(/Next\s+/i, 'Nächste ')
          .replace(/\s+months/i, ' Monate')
          .replace(/\s+month/i, ' Monat')
          .replace(/\s+days/i, ' Tage')
          .replace(/\s+day/i, ' Tag')
      }
      return period
    }

    onMounted(loadForecasts)

    return {
      t,
      loading,
      error,
      forecasts,
      itemsLabel,
      getForecastsByTrend,
      getChangePercent,
      getChangeColor,
      translatePeriod
    }
  }
}
</script>

<style scoped>
/* Three trend panels: one per direction, a small square marker carries the status color */
.demand-trend-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.trend-card {
  margin-bottom: 0;
}

.trend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  margin-right: 8px;
  background: var(--ink-muted);
}

.increasing-card .trend-dot { background: var(--ok); }
.stable-card .trend-dot { background: var(--info); }
.decreasing-card .trend-dot { background: var(--bad); }

.trend-items {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-top: 8px;
  padding-bottom: 8px;
}

.trend-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 36px;
  border-top: 1px solid var(--rule);
}

.trend-item:first-child {
  border-top: none;
}

.item-name {
  font-size: 13px;
  color: var(--ink-body);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 16px;
}

.item-change {
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.increasing-card .item-change { color: var(--ok-ink); }
.stable-card .item-change { color: var(--ink-muted); }
.decreasing-card .item-change { color: var(--bad-ink); }

.more-items {
  font-size: 13px;
  color: var(--ink-muted);
  padding: 8px 0 0;
  border-top: 1px solid var(--rule);
}
</style>
