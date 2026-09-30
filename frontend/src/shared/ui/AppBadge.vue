<script setup lang="ts">
import type { ReportStatus } from '../types'
import { formatStatusName } from '../lib/formatter'

interface Props {
  status?: ReportStatus | string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}

const props = withDefaults(defineProps<Props>(), {
  status: 'draft',
  variant: 'default',
})

function getComputedVariant(): string {
  if (props.variant !== 'default') return props.variant
  switch (props.status) {
    case 'approved':
      return 'success'
    case 'submitted':
      return 'info'
    case 'needs_revision':
      return 'warning'
    case 'in_progress':
      return 'info'
    case 'draft':
    default:
      return 'default'
  }
}
</script>

<template>
  <span :class="['app-badge', `variant-${getComputedVariant()}`]">
    <slot>{{ formatStatusName(props.status) }}</slot>
  </span>
</template>

<style scoped lang="scss">
.app-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.6rem;
  font-size: 0.78rem;
  font-weight: 600;
  border-radius: 9999px;
  line-height: 1;

  &.variant-default {
    background-color: #f1f5f9;
    color: #475569;
  }

  &.variant-success {
    background-color: #d1fae5;
    color: #065f46;
  }

  &.variant-warning {
    background-color: #fef3c7;
    color: #92400e;
  }

  &.variant-danger {
    background-color: #fee2e2;
    color: #991b1b;
  }

  &.variant-info {
    background-color: #e0e7ff;
    color: #3730a3;
  }
}
</style>
