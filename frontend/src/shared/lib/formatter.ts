export function formatNumber(val: number | null | undefined, precision = 1): string {
  if (val === null || val === undefined || isNaN(val)) {
    return '—'
  }
  return Number(val).toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision,
  })
}

export function formatStatusName(status: string): string {
  switch (status) {
    case 'draft':
      return 'Черновик'
    case 'in_progress':
      return 'Заполняется'
    case 'ready_to_submit':
      return 'Готов к отправке'
    case 'submitted':
      return 'Отправлен на проверку'
    case 'needs_revision':
      return 'Требует уточнения'
    case 'approved':
      return 'Принят статистикой'
    default:
      return status
  }
}

export function formatActivityTypeName(type: string): string {
  switch (type) {
    case 'crops':
      return 'Растениеводство'
    case 'livestock':
      return 'Животноводство'
    case 'mixed':
      return 'Растениеводство + Животноводство'
    default:
      return type
  }
}
