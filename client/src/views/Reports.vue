<template>
  <div class="reports">
    <div class="page-header">
      <h2>{{ t('reports.title') }}</h2>
      <p>{{ t('reports.description') }}</p>
    </div>

    <div v-if="loading" class="loading">{{ t('reports.loading') }}</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="isEmpty" class="loading">{{ t('reports.noData') }}</div>
    <div v-else>
      <!-- Quarterly performance -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">{{ t('reports.quarterlyPerformance') }}</h3>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>{{ t('reports.quarter') }}</th>
                <th class="num">{{ t('reports.totalOrders') }}</th>
                <th class="num">{{ t('reports.totalRevenue') }}</th>
                <th class="num">{{ t('reports.avgOrderValue') }}</th>
                <th class="num">{{ t('reports.fulfillmentRate') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="q in quarterlyData" :key="q.quarter">
                <td class="nowrap"><strong>{{ q.quarter }}</strong></td>
                <td class="num">{{ q.total_orders }}</td>
                <td class="num">{{ money(q.total_revenue) }}</td>
                <td class="num">{{ money(q.avg_order_value) }}</td>
                <td class="num">
                  <span :class="getFulfillmentClass(q.fulfillment_rate)">
                    {{ q.fulfillment_rate }}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Monthly Trends Chart -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">{{ t('reports.monthlyRevenueTrend') }}</h3>
        </div>
        <div class="chart-container panel-body">
          <div class="bar-chart">
            <div v-for="month in monthlyData" :key="month.month" class="bar-wrapper">
              <div class="bar-container">
                <div
                  class="bar"
                  :style="{ height: getBarHeight(month.revenue) + 'px' }"
                  :title="money(month.revenue)"
                ></div>
              </div>
              <div class="bar-label">{{ formatMonth(month.month) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Month-over-Month Comparison -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">{{ t('reports.monthOverMonth') }}</h3>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>{{ t('reports.month') }}</th>
                <th class="num">{{ t('reports.orders') }}</th>
                <th class="num">{{ t('reports.revenue') }}</th>
                <th class="num">{{ t('reports.change') }}</th>
                <th class="num">{{ t('reports.growthRate') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in monthlyRows" :key="row.month.month">
                <td class="nowrap"><strong>{{ formatMonth(row.month.month) }}</strong></td>
                <td class="num">{{ row.month.order_count }}</td>
                <td class="num">{{ money(row.month.revenue) }}</td>
                <td class="num">
                  <span v-if="row.prev" :class="getChangeClass(row.month.revenue, row.prev.revenue)">
                    {{ getChangeValue(row.month.revenue, row.prev.revenue) }}
                  </span>
                  <span v-else>-</span>
                </td>
                <td class="num">
                  <span v-if="row.prev" :class="getChangeClass(row.month.revenue, row.prev.revenue)">
                    {{ getGrowthRate(row.month.revenue, row.prev.revenue) }}
                  </span>
                  <span v-else>-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Summary Stats -->
      <div class="stats-grid reports-stats">
        <div class="stat-card">
          <div class="stat-label">{{ t('reports.totalRevenueYtd') }}</div>
          <div class="stat-value">{{ money(totalRevenue) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">{{ t('reports.avgMonthlyRevenue') }}</div>
          <div class="stat-value">{{ money(avgMonthlyRevenue) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">{{ t('reports.totalOrdersYtd') }}</div>
          <div class="stat-value">{{ totalOrders }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">{{ t('reports.bestQuarter') }}</div>
          <div class="stat-value">{{ bestQuarter || '-' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { api } from '../api'
import { useFilters } from '../composables/useFilters'
import { useFilteredData } from '../composables/useFilteredData'
import { useI18n } from '../composables/useI18n'
import { formatCurrencyWithDecimals } from '../utils/currency'

const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

export default {
  name: 'Reports',
  setup() {
    const { t, currentCurrency, currentLocale } = useI18n()
    const {
      selectedPeriod,
      selectedLocation,
      selectedCategory,
      selectedStatus,
      getCurrentFilters
    } = useFilters()

    const { data: reportData, loading, error } = useFilteredData(
      async () => {
        const filters = getCurrentFilters()
        const [quarterly, monthly] = await Promise.all([
          api.getQuarterlyReports(filters),
          api.getMonthlyTrends(filters)
        ])
        return { quarterly, monthly }
      },
      {
        watchSources: [selectedPeriod, selectedLocation, selectedCategory, selectedStatus],
        errorMessage: (err) => t('reports.loadError', { message: err.message })
      }
    )
    const quarterlyData = computed(() => reportData.value?.quarterly || [])
    const monthlyData = computed(() => reportData.value?.monthly || [])

    const isEmpty = computed(() => quarterlyData.value.length === 0 && monthlyData.value.length === 0)

    const totalRevenue = computed(() => monthlyData.value.reduce((sum, m) => sum + m.revenue, 0))
    const totalOrders = computed(() => monthlyData.value.reduce((sum, m) => sum + m.order_count, 0))
    const avgMonthlyRevenue = computed(() =>
      monthlyData.value.length ? totalRevenue.value / monthlyData.value.length : 0
    )
    const maxRevenue = computed(() => Math.max(0, ...monthlyData.value.map(m => m.revenue)))

    const bestQuarter = computed(() => {
      let best = null
      for (const q of quarterlyData.value) {
        if (!best || q.total_revenue > best.total_revenue) best = q
      }
      return best && best.total_revenue > 0 ? best.quarter : ''
    })

    // Each row carries its previous month (null for the first) so the template needs no index lookups
    const monthlyRows = computed(() =>
      monthlyData.value.map((month, i) => ({ month, prev: i > 0 ? monthlyData.value[i - 1] : null }))
    )

    // Amounts are USD from the API; the util converts to JPY when needed
    const money = (amount) => formatCurrencyWithDecimals(amount, currentCurrency.value, 2)

    // 'YYYY-MM' -> "Jan 2025" (en) or "2025年1月" (ja); returns the raw input if malformed
    const formatMonth = (monthStr) => {
      if (typeof monthStr !== 'string') return ''
      const match = /^(\d{4})-(\d{2})$/.exec(monthStr)
      if (!match) return monthStr
      const key = MONTH_KEYS[parseInt(match[2], 10) - 1]
      if (!key) return monthStr
      const label = t(`months.${key}`)
      return currentLocale.value === 'ja' ? `${match[1]}年${label}` : `${label} ${match[1]}`
    }

    const getBarHeight = (revenue) => {
      if (maxRevenue.value === 0) return 0
      return (revenue / maxRevenue.value) * 200
    }

    const getFulfillmentClass = (rate) => {
      if (rate >= 90) return 'badge success'
      if (rate >= 75) return 'badge warning'
      return 'badge danger'
    }

    const getChangeValue = (current, previous) => {
      const change = current - previous
      if (change > 0) return '+' + money(change)
      if (change < 0) return '-' + money(Math.abs(change))
      return money(0)
    }

    const getChangeClass = (current, previous) => {
      const change = current - previous
      if (change > 0) return 'positive-change'
      if (change < 0) return 'negative-change'
      return ''
    }

    const getGrowthRate = (current, previous) => {
      if (previous === 0) return t('reports.notApplicable')
      const rate = ((current - previous) / previous) * 100
      return (rate > 0 ? '+' : '') + rate.toFixed(1) + '%'
    }

    return {
      t,
      loading,
      error,
      isEmpty,
      quarterlyData,
      monthlyData,
      monthlyRows,
      totalRevenue,
      avgMonthlyRevenue,
      totalOrders,
      bestQuarter,
      money,
      formatMonth,
      getBarHeight,
      getFulfillmentClass,
      getChangeValue,
      getChangeClass,
      getGrowthRate
    }
  }
}
</script>

<style scoped>
.reports-stats { margin-top: 24px; }

.chart-container { min-height: 300px; overflow-x: auto; }
.bar-chart {
  display: flex; align-items: flex-end; justify-content: space-around;
  height: 250px; gap: 8px; min-width: 480px;
}
.bar-wrapper { display: flex; flex-direction: column; align-items: center; flex: 1; max-width: 80px; }
/* Baseline rule under the bars */
.bar-container { height: 200px; display: flex; align-items: flex-end; width: 100%; border-bottom: 1px solid var(--rule); }
.bar { width: 100%; background: var(--info); border-radius: 2px 2px 0 0; cursor: pointer; transition: opacity 0.15s ease; }
.bar:hover { opacity: 0.8; }
.bar-label {
  font-size: 12px; color: var(--ink-muted); font-variant-numeric: tabular-nums;
  text-align: center; transform: rotate(-45deg); white-space: nowrap; margin-top: 24px;
}

.positive-change { color: var(--ok-ink); font-weight: 600; }
.negative-change { color: var(--bad-ink); font-weight: 600; }
</style>
