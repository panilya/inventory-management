<template>
  <svg class="nav-icon" viewBox="0 0 24 24" width="20" height="20" fill="none"
       stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"
       aria-hidden="true" focusable="false">
    <path v-for="d in paths" :key="d" :d="d" />
  </svg>
</template>

<script setup>
import { computed } from 'vue'
import { navIcons } from './navIcons'

const props = defineProps({ name: { type: String, default: 'dot' } })
const paths = computed(() => navIcons[props.name] || navIcons.dot)
</script>

<style scoped>
.nav-icon { flex-shrink: 0; }
</style>
