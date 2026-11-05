import { ref, shallowRef, watch, onMounted } from 'vue'

// Shared loading/error/reload lifecycle for views driven by the global filters.
//
// fetcher:       async () => data (may return an object built from Promise.all)
// watchSources:  optional watch source(s); the data reloads whenever they change
// errorMessage:  string, or (err) => string, shown in `error` when a load fails
export function useFilteredData(fetcher, { watchSources, errorMessage } = {}) {
  // shallowRef: the payload is replaced wholesale on each load, no deep tracking needed
  const data = shallowRef(null)
  const loading = ref(true)
  const error = ref(null)

  // Request sequence: a slow earlier request must not overwrite the result
  // (or loading/error state) of a newer one after the filters change.
  let seq = 0

  const load = async () => {
    const id = ++seq
    loading.value = true
    // Clear any previous failure so a successful reload leaves the error state
    error.value = null
    try {
      const result = await fetcher()
      if (id === seq) data.value = result
    } catch (err) {
      if (id === seq) {
        error.value = typeof errorMessage === 'function'
          ? errorMessage(err)
          : (errorMessage || 'Failed to load data')
        console.error(err)
      }
    } finally {
      if (id === seq) loading.value = false
    }
  }

  if (watchSources) watch(watchSources, load)
  onMounted(load)

  return { data, loading, error, reload: load }
}
