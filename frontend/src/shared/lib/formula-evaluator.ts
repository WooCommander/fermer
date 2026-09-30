/**
 * Безопасное вычисление арифметических выражений для контрольных соотношений строк формы
 */
export function evaluateFormulaExpression(
  expression: string,
  values: Record<string, number | null>,
): number {
  if (!expression || expression.trim() === '') {
    return 0
  }

  // Поддержка диапазонов вида sum(067:080)
  let normalized = expression.replace(/sum\((\d+):(\d+)\)/gi, (_, startStr: string, endStr: string) => {
    const start = parseInt(startStr, 10)
    const end = parseInt(endStr, 10)
    const codes: string[] = []
    for (let i = start; i <= end; i++) {
      codes.push(i.toString().padStart(startStr.length, '0'))
    }
    return codes.join(' + ')
  })

  // Заменяем коды строк (например 001, 002, 150) на их числовые значения
  // Ищем токены из 3 цифр (или \b\d{3}\b)
  normalized = normalized.replace(/\b(\d{3})\b/g, (match) => {
    const val = values[match]
    return typeof val === 'number' && !isNaN(val) ? val.toString() : '0'
  })

  try {
    // Безопасный парсер только арифметических операций (+, -, *, /)
    const sanitized = normalized.replace(/[^0-9+\-*/. ()]/g, '')
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const result = new Function(`'use strict'; return (${sanitized || '0'})`)() as unknown
    if (typeof result === 'number' && !isNaN(result)) {
      return Math.round(result * 100) / 100
    }
    return 0
  } catch {
    return 0
  }
}
