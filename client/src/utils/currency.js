// Currency conversion utility
// Approximate fixed exchange rates from USD (all API amounts are USD)
const USD_RATES = {
  USD: 1,
  JPY: 150,
  EUR: 0.92
}

const CURRENCY_LOCALE = {
  USD: 'en-US',
  JPY: 'ja-JP',
  EUR: 'de-DE'
}

const CURRENCY_SYMBOL = {
  USD: '$',
  JPY: '¥',
  EUR: '€'
}

export function currencySymbol(currency = 'USD') {
  return CURRENCY_SYMBOL[currency] || '$'
}

export function convertAmount(amount, currency = 'USD') {
  const converted = amount * (USD_RATES[currency] ?? 1)
  // Yen has no minor unit, so round to whole yen
  return currency === 'JPY' ? Math.round(converted) : converted
}

// Formats an already-converted number. EUR follows German convention: "1.234 €" (symbol after, dot grouping)
function formatConverted(value, currency, decimals) {
  const number = value.toLocaleString(CURRENCY_LOCALE[currency] || 'en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
  if (currency === 'EUR') return `${number} €`
  return `${currencySymbol(currency)}${number}`
}

export function formatCurrency(amount, currency = 'USD') {
  return formatConverted(convertAmount(amount, currency), currency, 0)
}

export function formatCurrencyWithDecimals(amount, currency = 'USD', decimals = 0) {
  // JPY ignores decimals (no minor unit)
  return formatConverted(convertAmount(amount, currency), currency, currency === 'JPY' ? 0 : decimals)
}
