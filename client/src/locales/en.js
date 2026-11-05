export default {
  // Navigation
  nav: {
    overview: 'Overview',
    inventory: 'Inventory',
    orders: 'Orders',
    finance: 'Finance',
    reports: 'Reports',
    main: 'Main navigation',
    collapse: 'Collapse',
    expand: 'Expand sidebar',
    openMenu: 'Open navigation',
    closeMenu: 'Close navigation',
    demandForecast: 'Demand forecast',
    companyName: 'Catalyst Components',
    subtitle: 'Inventory management'
  },

  // Dashboard
  dashboard: {
    title: 'Overview',
    kpi: {
      title: 'Key performance indicators',
      inventoryTurnover: 'Inventory turnover rate',
      ordersFulfilled: 'Orders fulfilled',
      orderFillRate: 'Order fill rate',
      revenue: 'Revenue (orders)',
      revenueYTD: 'Revenue (orders) YTD',
      revenueMTD: 'Revenue (orders) MTD',
      avgProcessingTime: 'Avg processing time (days)',
      goal: 'Goal'
    },
    summary: {
      title: 'Summary'
    },
    orderHealth: {
      title: 'Order health',
      totalOrders: 'Total orders',
      revenue: 'Revenue',
      avgOrderValue: 'Avg order value',
      onTimeRate: 'On-time rate',
      avgFulfillmentDays: 'Avg fulfillment (days)',
      total: 'Total'
    },
    ordersByMonth: {
      title: 'Orders by month'
    },
    inventoryValue: {
      title: 'Inventory value by category'
    },
    inventoryShortages: {
      title: 'Inventory shortages',
      noShortages: 'No inventory shortages - all orders can be fulfilled!',
      noData: 'No inventory data for selected filters',
      orderId: 'Order ID',
      sku: 'SKU',
      itemName: 'Item name',
      quantityNeeded: 'Quantity needed',
      quantityAvailable: 'Quantity available',
      shortage: 'Shortage',
      daysDelayed: 'Days delayed',
      priority: 'Priority',
      unitsShort: 'units short',
      days: 'days'
    },
    topProducts: {
      title: 'Top products by revenue',
      sku: 'SKU',
      product: 'Product',
      category: 'Category',
      warehouse: 'Warehouse',
      stockStatus: 'Stock status',
      revenue: 'Revenue',
      unitsOrdered: 'Units ordered',
      firstOrder: 'First order',
      inStock: 'In stock',
      lowStock: 'Low stock'
    }
  },

  // Inventory
  inventory: {
    title: 'Inventory',
    description: 'Track and manage all inventory items',
    stockLevels: 'Stock levels',
    skus: 'SKUs',
    searchPlaceholder: 'Search by item name...',
    clearSearch: 'Clear search',
    totalItems: 'Total items',
    totalValue: 'Total value',
    lowStockItems: 'Low stock items',
    warehouses: 'Warehouses',
    table: {
      sku: 'SKU',
      itemName: 'Item name',
      name: 'Name',
      category: 'Category',
      warehouse: 'Warehouse',
      quantity: 'Quantity',
      quantityOnHand: 'Quantity on hand',
      reorderPoint: 'Reorder point',
      unitCost: 'Unit cost',
      unitPrice: 'Unit price',
      totalValue: 'Total value',
      location: 'Location',
      status: 'Status'
    }
  },

  // Orders
  orders: {
    title: 'Orders',
    description: 'View and manage customer orders',
    allOrders: 'All orders',
    totalOrders: 'Total orders',
    totalRevenue: 'Total revenue',
    avgOrderValue: 'Avg order value',
    onTimeDelivery: 'On-time delivery',
    itemsCount: '{count} items',
    itemsCountOne: '{count} item',
    quantity: 'Qty',
    table: {
      orderNumber: 'Order number',
      orderId: 'Order ID',
      orderDate: 'Order date',
      date: 'Date',
      customer: 'Customer',
      category: 'Category',
      warehouse: 'Warehouse',
      items: 'Items',
      value: 'Value',
      totalValue: 'Total value',
      status: 'Status',
      expectedDelivery: 'Expected delivery',
      actualDelivery: 'Actual delivery'
    }
  },

  // Finance/Spending
  finance: {
    title: 'Finance dashboard',
    description: 'Track revenue, costs, and financial performance',
    totalRevenue: 'Total revenue',
    totalCosts: 'Total costs',
    netProfit: 'Net profit',
    avgOrderValue: 'Avg order value',
    fromOrders: 'From {count} orders',
    costBreakdown: 'Procurement + operational + labor + overhead',
    margin: 'margin',
    perOrderRevenue: 'Per order revenue',
    revenueVsCosts: {
      title: 'Monthly revenue vs costs',
      revenue: 'Revenue',
      costs: 'Total costs'
    },
    monthlyCostFlow: {
      title: 'Monthly cost flow',
      procurement: 'Procurement',
      operational: 'Operational',
      labor: 'Labor',
      overhead: 'Overhead'
    },
    categorySpending: {
      title: 'Spending by category',
      ofTotal: 'of total'
    },
    transactions: {
      title: 'Recent transactions',
      id: 'ID',
      description: 'Description',
      vendor: 'Vendor',
      date: 'Date',
      amount: 'Amount'
    }
  },

  // Demand Forecast
  demand: {
    title: 'Demand forecast',
    description: 'Analyze demand trends and forecasts',
    increasingDemand: 'Increasing demand',
    stableDemand: 'Stable demand',
    decreasingDemand: 'Decreasing demand',
    itemsCount: '{count} items',
    itemsCountOne: '{count} item',
    more: 'more...',
    demandForecasts: 'Demand forecasts',
    table: {
      sku: 'SKU',
      itemName: 'Item name',
      currentDemand: 'Current demand',
      forecastedDemand: 'Forecasted demand',
      change: 'Change',
      trend: 'Trend',
      period: 'Period'
    }
  },

  // Filters
  filters: {
    title: 'Filters',
    reset: 'Reset filters',
    timePeriod: 'Time period',
    location: 'Location',
    category: 'Category',
    orderStatus: 'Order status',
    all: 'All',
    allMonths: 'All months'
  },

  // Statuses
  status: {
    delivered: 'Delivered',
    shipped: 'Shipped',
    processing: 'Processing',
    backordered: 'Backordered',
    inStock: 'In stock',
    lowStock: 'Low stock',
    adequate: 'Adequate'
  },

  // Trends
  trends: {
    increasing: 'Increasing',
    stable: 'Stable',
    decreasing: 'Decreasing'
  },

  // Priority
  priority: {
    high: 'High',
    medium: 'Medium',
    low: 'Low'
  },

  // Categories
  categories: {
    circuitBoards: 'Circuit Boards',
    sensors: 'Sensors',
    actuators: 'Actuators',
    controllers: 'Controllers',
    powerSupplies: 'Power Supplies'
  },

  // Spending Categories
  spendingCategories: {
    rawMaterials: 'Raw Materials',
    components: 'Components',
    equipment: 'Equipment',
    consumables: 'Consumables'
  },

  // Warehouses
  warehouses: {
    sanFrancisco: 'San Francisco',
    london: 'London',
    tokyo: 'Tokyo'
  },

  // Months
  months: {
    jan: 'Jan',
    feb: 'Feb',
    mar: 'Mar',
    apr: 'Apr',
    may: 'May',
    jun: 'Jun',
    jul: 'Jul',
    aug: 'Aug',
    sep: 'Sep',
    oct: 'Oct',
    nov: 'Nov',
    dec: 'Dec',
    january: 'January',
    february: 'February',
    march: 'March',
    april: 'April',
    june: 'June',
    july: 'July',
    august: 'August',
    september: 'September',
    october: 'October',
    november: 'November',
    december: 'December'
  },

  // Profile Menu
  profile: {
    profileDetails: 'Profile details',
    myTasks: 'My tasks',
    logout: 'Logout'
  },

  // Profile Details Modal
  profileDetails: {
    title: 'Profile details',
    email: 'Email',
    department: 'Department',
    location: 'Location',
    phone: 'Phone',
    joinDate: 'Join date',
    employeeId: 'Employee ID',
    close: 'Close'
  },

  // Tasks Modal
  tasks: {
    title: 'My tasks',
    taskTitle: 'Task title',
    taskTitlePlaceholder: 'Enter task title...',
    priority: 'Priority',
    dueDate: 'Due date',
    addTask: 'Add task',
    noTasks: 'No tasks yet. Add your first task above!'
  },

  // Language
  language: {
    english: 'English',
    japanese: 'Japanese',
    selectLanguage: 'Select language'
  },

  // Common
  common: {
    loading: 'Loading...',
    error: 'Error',
    noData: 'No data available',
    viewDetails: 'View details',
    close: 'Close',
    save: 'Save',
    cancel: 'Cancel',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    items: 'items'
  }
}
