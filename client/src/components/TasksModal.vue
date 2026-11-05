<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-overlay" @click="close">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">{{ t('tasks.title') }}</h3>
            <button class="close-button" @click="close" aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <!-- Add task form -->
            <div class="task-form">
              <div class="form-row">
                <div class="form-group flex-1">
                  <label for="task-title">{{ t('tasks.taskTitle') }}</label>
                  <input
                    id="task-title"
                    v-model="newTask.title"
                    type="text"
                    :placeholder="t('tasks.taskTitlePlaceholder')"
                    class="input"
                    @keyup.enter="handleAddTask"
                  />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="task-priority">{{ t('tasks.priority') }}</label>
                  <select
                    id="task-priority"
                    v-model="newTask.priority"
                    class="select"
                  >
                    <option value="high">{{ t('priority.high') }}</option>
                    <option value="medium">{{ t('priority.medium') }}</option>
                    <option value="low">{{ t('priority.low') }}</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="task-due-date">{{ t('tasks.dueDate') }}</label>
                  <input
                    id="task-due-date"
                    v-model="newTask.dueDate"
                    type="date"
                    class="input"
                  />
                </div>

                <div class="form-group-btn">
                  <button @click="handleAddTask" class="btn btn-primary" :disabled="!newTask.title.trim() || !newTask.dueDate">
                    {{ t('tasks.addTask') }}
                  </button>
                </div>
              </div>
            </div>

            <div class="tasks-divider"></div>

            <!-- Tasks List -->
            <div v-if="sortedTasks.length === 0" class="no-tasks">
              {{ t('tasks.noTasks') }}
            </div>

            <div v-else class="tasks-list">
              <div
                v-for="task in sortedTasks"
                :key="task.id"
                class="task-item"
                :class="[`priority-${task.priority}`, { completed: task.status === 'completed' }]"
              >
                <div class="task-header">
                  <div class="task-check-title">
                    <input
                      type="checkbox"
                      :checked="task.status === 'completed'"
                      @change="$emit('toggle-task', task.id)"
                      class="task-checkbox"
                    />
                    <span class="task-title" @click="$emit('toggle-task', task.id)">{{ task.title }}</span>
                  </div>
                  <button @click="$emit('delete-task', task.id)" class="task-delete-btn" title="Delete task" aria-label="Delete task">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                  </button>
                </div>

                <div class="task-footer">
                  <span class="status-pill" :class="task.priority">
                    {{ translatePriority(task.priority) }}
                  </span>
                  <div class="task-due-date">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="2" y="3" width="10" height="9" rx="1" stroke="currentColor" stroke-width="1.2"/>
                      <path d="M4.5 1.5V4.5M9.5 1.5V4.5M2 6H12" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                    </svg>
                    {{ formatDueDate(task.dueDate) }}
                  </div>
                  <span class="status-pill task-status" :class="getStatusClass(task.dueDate, task.status)">
                    {{ getStatusText(task.dueDate, task.status) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn" @click="close">{{ t('profileDetails.close') }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
import { ref, computed } from 'vue'
import { useI18n } from '../composables/useI18n'

export default {
  name: 'TasksModal',
  props: {
    isOpen: {
      type: Boolean,
      required: true
    },
    tasks: {
      type: Array,
      default: () => []
    }
  },
  emits: ['close', 'add-task', 'delete-task', 'toggle-task'],
  setup(props, { emit }) {
    const { t, intlLocale } = useI18n()
    const newTask = ref({
      title: '',
      priority: 'medium',
      dueDate: ''
    })

    const sortedTasks = computed(() => {
      // Don't sort - just return tasks in their current order (newest first)
      return [...props.tasks]
    })

    const close = () => {
      emit('close')
    }

    const handleAddTask = () => {
      if (newTask.value.title.trim() && newTask.value.dueDate) {
        emit('add-task', {
          title: newTask.value.title.trim(),
          priority: newTask.value.priority,
          dueDate: newTask.value.dueDate
        })
        newTask.value = {
          title: '',
          priority: 'medium',
          dueDate: ''
        }
      }
    }

    const formatDueDate = (dateString) => {
      const date = new Date(dateString)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const dueDate = new Date(date)
      dueDate.setHours(0, 0, 0, 0)

      const diffTime = dueDate - today
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 0) return t('tasks.today')
      if (diffDays === 1) return t('tasks.tomorrow')
      if (diffDays === -1) return t('tasks.yesterday')
      if (diffDays < 0) return t('tasks.daysAgo', { count: Math.abs(diffDays) })
      if (diffDays < 7) return t('tasks.inDays', { count: diffDays })

      return date.toLocaleDateString(intlLocale.value, {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      })
    }

    const getStatusClass = (dueDate, status) => {
      if (status === 'completed') return 'completed'

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const due = new Date(dueDate)
      due.setHours(0, 0, 0, 0)

      const diffTime = due - today
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays < 0) return 'overdue'
      if (diffDays <= 1) return 'urgent'
      return 'upcoming'
    }

    const getStatusText = (dueDate, status) => {
      if (status === 'completed') return t('tasks.completed')

      const statusClass = getStatusClass(dueDate, status)
      if (statusClass === 'overdue') return t('tasks.overdue')
      if (statusClass === 'urgent') return t('tasks.dueSoon')
      return t('tasks.upcoming')
    }

    const translatePriority = (priority) => {
      const priorityMap = {
        'high': t('priority.high'),
        'medium': t('priority.medium'),
        'low': t('priority.low')
      }
      return priorityMap[priority] || priority
    }

    return {
      t,
      newTask,
      sortedTasks,
      close,
      handleAddTask,
      formatDueDate,
      getStatusClass,
      getStatusText,
      translatePriority
    }
  }
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
  max-width: 720px;
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

/* Add-task form: flat steel panel, controls use global .input/.select */
.task-form {
  background: var(--steel-100);
  border: 1px solid var(--rule);
  border-radius: var(--radius-panel);
  padding: 16px;
}

.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.form-group-btn {
  display: flex;
  align-items: flex-end;
}

label {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-muted);
}

.btn:disabled {
  cursor: not-allowed;
}

.tasks-divider {
  height: 1px;
  background: var(--rule);
  margin: 24px 0;
}

.no-tasks {
  text-align: center;
  padding: 32px;
  color: var(--ink-muted);
  font-size: 15px;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Priority is carried by a 3px left rule: high = bad, medium = signal, low = info */
.task-item {
  background: var(--panel);
  border: 1px solid var(--rule);
  border-left: 3px solid var(--ink-muted);
  border-radius: var(--radius-panel);
  padding: 12px 16px;
  transition: background-color 0.15s ease;
}

.task-item:hover {
  background: var(--steel-100);
}

.task-item.priority-high { border-left-color: var(--bad); }
.task-item.priority-medium { border-left-color: var(--signal); }
.task-item.priority-low { border-left-color: var(--info); }

.task-item.completed {
  opacity: 0.7;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  gap: 16px;
}

.task-check-title {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.task-checkbox {
  width: 16px;
  height: 16px;
  margin: 0;
  cursor: pointer;
  accent-color: var(--ink);
  flex-shrink: 0;
}

.task-title {
  flex: 1;
  min-width: 0;
  cursor: pointer;
  user-select: none;
  color: var(--ink);
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.task-item.completed .task-title {
  text-decoration: line-through;
  color: var(--ink-muted);
}

.task-delete-btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  flex-shrink: 0;
  background: transparent;
  color: var(--ink-muted);
  border: none;
  border-radius: var(--radius-control);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.task-delete-btn:hover {
  background: var(--bad-soft);
  color: var(--bad-ink);
}

.task-footer {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 16px;
  padding-left: 28px; /* align under the title, past the checkbox */
}

.task-due-date {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--ink-muted);
}

.task-status {
  margin-left: auto;
}

@media (max-width: 575.98px) {
  .form-row {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
