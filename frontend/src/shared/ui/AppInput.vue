<script setup lang="ts">
interface Props {
  label?: string
  modelValue: string | number | null
  type?: string
  placeholder?: string
  unit?: string
  disabled?: boolean
  readonly?: boolean
  error?: string
  hint?: string
  min?: number
  max?: number
  step?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  type: 'text',
  placeholder: '',
  unit: '',
  disabled: false,
  readonly: false,
  error: '',
  hint: '',
  min: undefined,
  max: undefined,
  step: 'any',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'focus'): void
  (e: 'blur'): void
}>()

function onInput(e: Event): void {
  const target = e.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div :class="['app-input-wrapper', { 'has-error': !!props.error, 'is-disabled': props.disabled, 'is-readonly': props.readonly }]">
    <label v-if="props.label" class="app-input-label">
      <span>{{ props.label }}</span>
    </label>

    <div class="input-container">
      <input
        :type="props.type"
        :value="props.modelValue ?? ''"
        :placeholder="props.placeholder"
        :disabled="props.disabled"
        :readonly="props.readonly"
        :min="props.min"
        :max="props.max"
        :step="props.step"
        inputmode="decimal"
        class="input-field"
        @input="onInput"
        @focus="emit('focus')"
        @blur="emit('blur')"
      />
      <span v-if="props.unit" class="unit-badge">{{ props.unit }}</span>
    </div>

    <span v-if="props.error" class="error-msg">{{ props.error }}</span>
    <span v-else-if="props.hint" class="hint-msg">{{ props.hint }}</span>
  </div>
</template>

<style scoped lang="scss">
.app-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  width: 100%;

  &.has-error {
    .input-field {
      border-color: #ef4444;
      background-color: #fef2f2;
    }
  }

  &.is-readonly {
    .input-field {
      background-color: #f8fafc;
      color: #0f172a;
      font-weight: 600;
      border-color: #e2e8f0;
      cursor: default;
    }
  }
}

.app-input-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
}

.input-container {
  display: flex;
  align-items: center;
  position: relative;
}

.input-field {
  width: 100%;
  padding: 0.65rem 0.85rem;
  font-size: 1rem;
  font-family: inherit;
  color: #0f172a;
  background-color: #ffffff;
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus:not(:read-only) {
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
  }

  &:disabled {
    background-color: #f1f5f9;
    color: #94a3b8;
    cursor: not-allowed;
  }
}

.unit-badge {
  position: absolute;
  right: 0.75rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: #64748b;
  pointer-events: none;
  background: #f1f5f9;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
}

.error-msg {
  font-size: 0.78rem;
  color: #ef4444;
  font-weight: 500;
}

.hint-msg {
  font-size: 0.78rem;
  color: #64748b;
}
</style>
