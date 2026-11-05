import { ref, computed } from 'vue'
import { useI18n } from './useI18n'

// Base user data (language-independent)
const baseUserData = {
  id: 1,
  email: 'john.doe@catalystcomponents.com',
  phone: '+1 (111) 111-1111',
  avatar: null,
  joinDate: '2022-03-15'
}

// Language-specific mock profile fields; unknown locales fall back to English
const TASK_META = [
  { id: 1, priority: 'high', dueDate: '2025-10-08' },
  { id: 2, priority: 'medium', dueDate: '2025-10-06' },
  { id: 3, priority: 'medium', dueDate: '2025-10-10' },
  { id: 4, priority: 'low', dueDate: '2025-10-15' }
]

const LOCALIZED_PROFILE = {
  en: {
    name: 'John Doe',
    jobTitle: 'Operations Manager',
    department: 'Supply Chain Operations',
    location: 'San Francisco',
    taskTitles: [
      'Review Q4 inventory levels',
      'Approve Tokyo warehouse orders',
      'Update reorder points for Circuit Boards',
      'Review monthly spending report'
    ]
  },
  ja: {
    name: '田中 太郎',
    jobTitle: 'オペレーションマネージャー',
    department: 'サプライチェーン運営部',
    location: 'サンフランシスコ',
    taskTitles: [
      '第4四半期の在庫レベルを確認',
      '東京倉庫の注文を承認',
      '回路基板の再注文点を更新',
      '月次支出レポートを確認'
    ]
  },
  de: {
    name: 'John Doe',
    jobTitle: 'Betriebsleiter',
    department: 'Lieferkettenbetrieb',
    location: 'San Francisco',
    taskTitles: [
      'Lagerbestände für Q4 prüfen',
      'Aufträge des Lagers Tokio freigeben',
      'Meldebestände für Leiterplatten aktualisieren',
      'Monatlichen Ausgabenbericht prüfen'
    ]
  }
}

// Mock current user data with language-aware fields
const createCurrentUser = () => {
  const { currentLocale } = useI18n()

  return computed(() => {
    const { taskTitles, ...profile } = LOCALIZED_PROFILE[currentLocale.value] || LOCALIZED_PROFILE.en

    return {
      ...baseUserData,
      ...profile,
      tasks: TASK_META.map((task, i) => ({ ...task, title: taskTitles[i], status: 'pending' }))
    }
  })
}

const currentUser = createCurrentUser()

export function useAuth() {
  const isAuthenticated = ref(true)

  const logout = () => {
    // In a real app, this would clear tokens, etc.
    console.log('Logout clicked - would redirect to login')
    alert('Logout functionality - in a real app, this would clear session and redirect to login')
  }

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  return {
    currentUser,
    isAuthenticated,
    logout,
    getInitials
  }
}
