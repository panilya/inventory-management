import { ref, computed } from 'vue'
import en from '../locales/en'
import ja from '../locales/ja'
import de from '../locales/de'

const translations = {
  en,
  ja,
  de
}

// Load saved locale from localStorage, default to 'en'
const savedLocale = localStorage.getItem('app-locale') || 'en'
const currentLocale = ref(savedLocale)

// Currency is automatically set based on locale (en -> USD, ja -> JPY, de -> EUR)
const LOCALE_CURRENCY = { en: 'USD', ja: 'JPY', de: 'EUR' }
const currentCurrency = computed(() => LOCALE_CURRENCY[currentLocale.value] || 'USD')

// BCP 47 tag for Intl/toLocaleDateString so views don't hardcode per-language ternaries
const INTL_LOCALE = { en: 'en-US', ja: 'ja-JP', de: 'de-DE' }
const intlLocale = computed(() => INTL_LOCALE[currentLocale.value] || 'en-US')

// Native-language names shown in the language switcher
const LOCALE_NAMES = { en: 'English', ja: '日本語', de: 'Deutsch' }

export function useI18n() {
  const t = (key, params = {}) => {
    const keys = key.split('.')
    let value = translations[currentLocale.value]

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k]
      } else {
        // If translation not found, try English as fallback
        if (currentLocale.value !== 'en') {
          let fallback = translations.en
          for (const fk of keys) {
            if (fallback && typeof fallback === 'object') {
              fallback = fallback[fk]
            } else {
              break
            }
          }
          if (fallback && typeof fallback === 'string') {
            return replacePlaceholders(fallback, params)
          }
        }
        // If still not found, return the key itself
        return key
      }
    }

    if (typeof value === 'string') {
      return replacePlaceholders(value, params)
    }

    return key
  }

  const replacePlaceholders = (text, params) => {
    return text.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match
    })
  }

  const setLocale = (locale) => {
    if (translations[locale]) {
      currentLocale.value = locale
      localStorage.setItem('app-locale', locale)
    }
  }

  const availableLocales = computed(() => Object.keys(translations))

  const localeName = computed(() => LOCALE_NAMES[currentLocale.value] || currentLocale.value)
  const getLocaleName = (locale) => LOCALE_NAMES[locale] || locale

  // Translate product names
  const translateProductName = (productName) => {
    return translations[currentLocale.value]?.productNames?.[productName] || productName
  }

  // Translate customer names
  const translateCustomerName = (customerName) => {
    return translations[currentLocale.value]?.customerNames?.[customerName] || customerName
  }

  // Translate warehouse names
  const translateWarehouse = (warehouseName) => {
    if (currentLocale.value === 'ja') {
      // Handle city names
      const cityMap = {
        'San Francisco': 'サンフランシスコ',
        'London': 'ロンドン',
        'Tokyo': '東京'
      }

      if (cityMap[warehouseName]) {
        return cityMap[warehouseName]
      }

      // Handle "Warehouse X-##" pattern
      if (warehouseName.startsWith('Warehouse ')) {
        return warehouseName.replace('Warehouse ', '倉庫')
      }

      return warehouseName
    }
    if (currentLocale.value === 'de') {
      if (warehouseName === 'Tokyo') return 'Tokio'
      if (warehouseName.startsWith('Warehouse ')) {
        return warehouseName.replace('Warehouse ', 'Lager ')
      }
    }
    return warehouseName
  }

  return {
    t,
    setLocale,
    currentLocale: computed(() => currentLocale.value),
    currentCurrency,
    intlLocale,
    availableLocales,
    localeName,
    getLocaleName,
    translateProductName,
    translateCustomerName,
    translateWarehouse
  }
}
