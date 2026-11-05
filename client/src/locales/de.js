export default {
  // Navigation
  nav: {
    overview: 'Übersicht',
    inventory: 'Bestand',
    orders: 'Aufträge',
    finance: 'Finanzen',
    reports: 'Berichte',
    main: 'Hauptnavigation',
    collapse: 'Einklappen',
    expand: 'Seitenleiste ausklappen',
    openMenu: 'Navigation öffnen',
    closeMenu: 'Navigation schließen',
    demandForecast: 'Bedarfsprognose',
    companyName: 'Catalyst Components',
    subtitle: 'Bestandsverwaltung'
  },

  // Reports
  reports: {
    title: 'Leistungsberichte',
    description: 'Quartalskennzahlen und monatliche Trends anzeigen',
    loading: 'Berichte werden geladen...',
    loadError: 'Berichte konnten nicht geladen werden: {message}',
    noData: 'Keine Berichtsdaten für die ausgewählten Filter',
    quarterlyPerformance: 'Quartalsleistung',
    monthlyRevenueTrend: 'Monatlicher Umsatzverlauf',
    monthOverMonth: 'Vergleich zum Vormonat',
    quarter: 'Quartal',
    month: 'Monat',
    totalOrders: 'Aufträge gesamt',
    totalRevenue: 'Umsatz gesamt',
    avgOrderValue: 'Ø Auftragswert',
    fulfillmentRate: 'Erfüllungsquote',
    orders: 'Aufträge',
    revenue: 'Umsatz',
    change: 'Veränderung',
    growthRate: 'Wachstumsrate',
    notApplicable: 'k. A.',
    totalRevenueYtd: 'Umsatz gesamt (lfd. Jahr)',
    avgMonthlyRevenue: 'Ø Monatsumsatz',
    totalOrdersYtd: 'Aufträge gesamt (lfd. Jahr)',
    bestQuarter: 'Stärkstes Quartal'
  },

  // Dashboard
  dashboard: {
    title: 'Übersicht',
    kpi: {
      title: 'Leistungskennzahlen',
      inventoryTurnover: 'Lagerumschlagsrate',
      ordersFulfilled: 'Erfüllte Aufträge',
      orderFillRate: 'Auftragserfüllungsrate',
      revenue: 'Umsatz (Aufträge)',
      revenueYTD: 'Umsatz (Aufträge) lfd. Jahr',
      revenueMTD: 'Umsatz (Aufträge) lfd. Monat',
      avgProcessingTime: 'Ø Bearbeitungszeit (Tage)',
      goal: 'Ziel'
    },
    summary: {
      title: 'Zusammenfassung'
    },
    orderHealth: {
      title: 'Auftragsstatus',
      totalOrders: 'Aufträge gesamt',
      revenue: 'Umsatz',
      avgOrderValue: 'Ø Auftragswert',
      onTimeRate: 'Pünktlichkeitsquote',
      avgFulfillmentDays: 'Ø Erfüllung (Tage)',
      total: 'Gesamt'
    },
    ordersByMonth: {
      title: 'Aufträge nach Monat'
    },
    inventoryValue: {
      title: 'Bestandswert nach Kategorie'
    },
    inventoryShortages: {
      title: 'Bestandsengpässe',
      noShortages: 'Keine Bestandsengpässe - alle Aufträge können erfüllt werden!',
      noData: 'Keine Bestandsdaten für die ausgewählten Filter',
      orderId: 'Auftrags-ID',
      sku: 'Artikelnr.',
      itemName: 'Artikelname',
      quantityNeeded: 'Benötigte Menge',
      quantityAvailable: 'Verfügbare Menge',
      shortage: 'Fehlmenge',
      daysDelayed: 'Tage Verzug',
      priority: 'Priorität',
      unitsShort: 'Einheiten fehlen',
      days: 'Tage'
    },
    topProducts: {
      title: 'Top-Produkte nach Umsatz',
      sku: 'Artikelnr.',
      product: 'Produkt',
      category: 'Kategorie',
      warehouse: 'Lager',
      stockStatus: 'Lagerstatus',
      revenue: 'Umsatz',
      unitsOrdered: 'Bestellte Einheiten',
      firstOrder: 'Erster Auftrag',
      inStock: 'Auf Lager',
      lowStock: 'Niedriger Bestand'
    }
  },

  // Inventory
  inventory: {
    title: 'Bestand',
    description: 'Alle Lagerartikel verfolgen und verwalten',
    stockLevels: 'Lagerbestände',
    skus: 'Artikel',
    searchPlaceholder: 'Nach Artikelname suchen...',
    clearSearch: 'Suche löschen',
    totalItems: 'Artikel gesamt',
    totalValue: 'Gesamtwert',
    lowStockItems: 'Artikel mit niedrigem Bestand',
    warehouses: 'Lager',
    table: {
      sku: 'Artikelnr.',
      itemName: 'Artikelname',
      name: 'Name',
      category: 'Kategorie',
      warehouse: 'Lager',
      quantity: 'Menge',
      quantityOnHand: 'Lagermenge',
      reorderPoint: 'Meldebestand',
      unitCost: 'Stückkosten',
      unitPrice: 'Stückpreis',
      totalValue: 'Gesamtwert',
      location: 'Lagerort',
      status: 'Status'
    }
  },

  // Orders
  orders: {
    title: 'Aufträge',
    description: 'Kundenaufträge anzeigen und verwalten',
    allOrders: 'Alle Aufträge',
    totalOrders: 'Aufträge gesamt',
    totalRevenue: 'Umsatz gesamt',
    avgOrderValue: 'Ø Auftragswert',
    onTimeDelivery: 'Pünktliche Lieferung',
    itemsCount: '{count} Artikel',
    itemsCountOne: '{count} Artikel',
    quantity: 'Menge',
    table: {
      orderNumber: 'Auftragsnummer',
      orderId: 'Auftrags-ID',
      orderDate: 'Auftragsdatum',
      date: 'Datum',
      customer: 'Kunde',
      category: 'Kategorie',
      warehouse: 'Lager',
      items: 'Artikel',
      value: 'Wert',
      totalValue: 'Gesamtwert',
      status: 'Status',
      expectedDelivery: 'Voraussichtliche Lieferung',
      actualDelivery: 'Tatsächliche Lieferung'
    }
  },

  // Finance/Spending
  finance: {
    title: 'Finanzübersicht',
    description: 'Umsatz, Kosten und finanzielle Leistung verfolgen',
    totalRevenue: 'Umsatz gesamt',
    totalCosts: 'Kosten gesamt',
    netProfit: 'Nettogewinn',
    avgOrderValue: 'Ø Auftragswert',
    fromOrders: 'Aus {count} Aufträgen',
    costBreakdown: 'Beschaffung + Betrieb + Personal + Gemeinkosten',
    margin: 'Marge',
    perOrderRevenue: 'Umsatz pro Auftrag',
    revenueVsCosts: {
      title: 'Monatlicher Umsatz vs. Kosten',
      revenue: 'Umsatz',
      costs: 'Kosten gesamt'
    },
    monthlyCostFlow: {
      title: 'Monatlicher Kostenverlauf',
      procurement: 'Beschaffung',
      operational: 'Betrieb',
      labor: 'Personal',
      overhead: 'Gemeinkosten'
    },
    categorySpending: {
      title: 'Ausgaben nach Kategorie',
      ofTotal: 'vom Gesamtwert'
    },
    transactions: {
      title: 'Letzte Transaktionen',
      id: 'ID',
      description: 'Beschreibung',
      vendor: 'Lieferant',
      date: 'Datum',
      amount: 'Betrag'
    }
  },

  // Demand Forecast
  demand: {
    title: 'Bedarfsprognose',
    description: 'Bedarfstrends und Prognosen analysieren',
    increasingDemand: 'Steigender Bedarf',
    stableDemand: 'Stabiler Bedarf',
    decreasingDemand: 'Sinkender Bedarf',
    itemsCount: '{count} Artikel',
    itemsCountOne: '{count} Artikel',
    more: 'weitere...',
    demandForecasts: 'Bedarfsprognosen',
    table: {
      sku: 'Artikelnr.',
      itemName: 'Artikelname',
      currentDemand: 'Aktueller Bedarf',
      forecastedDemand: 'Prognostizierter Bedarf',
      change: 'Veränderung',
      trend: 'Trend',
      period: 'Zeitraum'
    }
  },

  // Filters
  filters: {
    title: 'Filter',
    reset: 'Filter zurücksetzen',
    timePeriod: 'Zeitraum',
    location: 'Standort',
    category: 'Kategorie',
    orderStatus: 'Auftragsstatus',
    all: 'Alle',
    allMonths: 'Alle Monate'
  },

  // Statuses
  status: {
    delivered: 'Geliefert',
    shipped: 'Versandt',
    processing: 'In Bearbeitung',
    backordered: 'Im Rückstand',
    inStock: 'Auf Lager',
    lowStock: 'Niedriger Bestand',
    adequate: 'Ausreichend'
  },

  // Trends
  trends: {
    increasing: 'Steigend',
    stable: 'Stabil',
    decreasing: 'Sinkend'
  },

  // Priority
  priority: {
    high: 'Hoch',
    medium: 'Mittel',
    low: 'Niedrig'
  },

  // Categories
  categories: {
    circuitBoards: 'Leiterplatten',
    sensors: 'Sensoren',
    actuators: 'Aktoren',
    controllers: 'Steuerungen',
    powerSupplies: 'Netzteile'
  },

  // Spending Categories
  spendingCategories: {
    rawMaterials: 'Rohstoffe',
    components: 'Bauteile',
    equipment: 'Ausrüstung',
    consumables: 'Verbrauchsmaterial'
  },

  // Warehouses
  warehouses: {
    sanFrancisco: 'San Francisco',
    london: 'London',
    tokyo: 'Tokio'
  },

  // Months
  months: {
    jan: 'Jan.',
    feb: 'Feb.',
    mar: 'März',
    apr: 'Apr.',
    may: 'Mai',
    jun: 'Juni',
    jul: 'Juli',
    aug: 'Aug.',
    sep: 'Sept.',
    oct: 'Okt.',
    nov: 'Nov.',
    dec: 'Dez.',
    january: 'Januar',
    february: 'Februar',
    march: 'März',
    april: 'April',
    june: 'Juni',
    july: 'Juli',
    august: 'August',
    september: 'September',
    october: 'Oktober',
    november: 'November',
    december: 'Dezember'
  },

  // Profile Menu
  profile: {
    profileDetails: 'Profildetails',
    myTasks: 'Meine Aufgaben',
    logout: 'Abmelden'
  },

  // Profile Details Modal
  profileDetails: {
    title: 'Profildetails',
    email: 'E-Mail',
    department: 'Abteilung',
    location: 'Standort',
    phone: 'Telefon',
    joinDate: 'Eintrittsdatum',
    employeeId: 'Personalnummer',
    close: 'Schließen'
  },

  // Tasks Modal
  tasks: {
    title: 'Meine Aufgaben',
    taskTitle: 'Aufgabentitel',
    taskTitlePlaceholder: 'Aufgabentitel eingeben...',
    priority: 'Priorität',
    dueDate: 'Fälligkeitsdatum',
    addTask: 'Aufgabe hinzufügen',
    noTasks: 'Noch keine Aufgaben. Fügen Sie oben Ihre erste Aufgabe hinzu!',
    today: 'heute',
    tomorrow: 'morgen',
    yesterday: 'gestern',
    daysAgo: 'vor {count} Tagen',
    inDays: 'in {count} Tagen',
    completed: 'Erledigt',
    overdue: 'Überfällig',
    dueSoon: 'Bald fällig',
    upcoming: 'Anstehend'
  },

  // Language
  language: {
    english: 'Englisch',
    japanese: 'Japanisch',
    german: 'Deutsch',
    selectLanguage: 'Sprache auswählen'
  },

  // Purchase orders (amounts are always shown in USD)
  purchaseOrder: {
    createAction: 'Bestellung anlegen',
    viewAction: 'Bestellung anzeigen',
    createTitle: 'Bestellung anlegen',
    viewTitle: 'Bestellung',
    sku: 'SKU',
    orderId: 'Auftrags-ID',
    shortage: 'Fehlmenge',
    units: '{count} Stück',
    supplier: 'Lieferantenname',
    quantity: 'Menge',
    unitCost: 'Stückkosten (USD)',
    total: 'Gesamt (USD)',
    expectedDelivery: 'Voraussichtliches Lieferdatum',
    createdDate: 'Erstellt',
    notes: 'Notizen',
    notesOptional: 'Notizen (optional)',
    submit: 'Bestellung anlegen',
    submitting: 'Wird angelegt...',
    loading: 'Bestellung wird geladen...',
    status: {
      pending: 'Ausstehend'
    },
    errors: {
      supplierRequired: 'Geben Sie einen Lieferantennamen ein.',
      quantityInvalid: 'Geben Sie eine ganze Zahl größer als 0 ein.',
      unitCostInvalid: 'Geben Sie Stückkosten ab 0 ein.',
      deliveryRequired: 'Wählen Sie ein Lieferdatum.',
      deliveryPast: 'Das Lieferdatum muss heute oder später liegen.',
      conflict: 'Für diesen Artikel existiert bereits eine Bestellung.',
      notFound: 'Rückstandsposition nicht gefunden.',
      generic: 'Die Bestellung konnte nicht angelegt werden. Versuchen Sie es erneut.',
      noneFound: 'Keine Bestellung für diesen Artikel gefunden',
      loadFailed: 'Die Bestellung konnte nicht geladen werden.'
    }
  },

  // Common
  common: {
    loading: 'Wird geladen...',
    error: 'Fehler',
    noData: 'Keine Daten verfügbar',
    viewDetails: 'Details anzeigen',
    close: 'Schließen',
    save: 'Speichern',
    cancel: 'Abbrechen',
    search: 'Suchen',
    filter: 'Filtern',
    export: 'Exportieren',
    items: 'Artikel'
  },

  // Product Names
  productNames: {
    'Single Layer PCB Assembly': 'Einlagige Leiterplattenbaugruppe',
    'Dual Layer PCB Assembly': 'Zweilagige Leiterplattenbaugruppe',
    'Multi Layer PCB Assembly': 'Mehrlagige Leiterplattenbaugruppe',
    'Temperature Sensor Module': 'Temperatursensormodul',
    'Humidity Sensor Module': 'Feuchtigkeitssensormodul',
    'Pressure Sensor Module': 'Drucksensormodul',
    'Proximity Sensor': 'Näherungssensor',
    'Ultrasonic Distance Sensor': 'Ultraschall-Abstandssensor',
    'Micro Servo Motor': 'Mikro-Servomotor',
    'Standard Servo Motor': 'Standard-Servomotor',
    'Stepper Motor NEMA 17': 'Schrittmotor NEMA 17',
    '8-bit Microcontroller': '8-Bit-Mikrocontroller',
    '32-bit ARM Microcontroller': '32-Bit-ARM-Mikrocontroller',
    'Digital Signal Processor': 'Digitaler Signalprozessor',
    '3-Axis Accelerometer': '3-Achsen-Beschleunigungssensor',
    'Gyroscope Module': 'Gyroskopmodul',
    'Light Dependent Resistor': 'Fotowiderstand',
    'Coil Spring Heavy Duty': 'Schraubenfeder (Schwerlast)',
    'Compression Spring': 'Druckfeder',
    'PWM Motor Controller': 'PWM-Motorsteuerung',
    'H-Bridge Motor Driver': 'H-Brücken-Motortreiber',
    'Stepper Motor NEMA 23': 'Schrittmotor NEMA 23',
    'Drive Pulley': 'Antriebsriemenscheibe',
    'LED Driver IC': 'LED-Treiber-IC',
    '5V 10A Switching Power Supply': '5V 10A Schaltnetzteil',
    '12V 5A Power Supply Module': '12V 5A Netzteilmodul',
    '24V 3A Industrial Power Supply': '24V 3A Industrienetzteil',
    'Dual Output ±15V Power Supply': 'Netzteil mit Doppelausgang ±15V',
    '48V DC Power Supply Unit': '48V DC Netzteil',
    'USB-C PD 100W Power Supply': 'USB-C PD 100W Netzteil',
    'Battery Backup Power Supply': 'Netzteil mit Batteriepufferung',
    'Adjustable Bench Power Supply': 'Einstellbares Labornetzteil'
  }

  // Customer names are company names and stay untranslated (no customerNames map)
}
