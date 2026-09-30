import type { ValidationRule, ValidationIssue } from '../types'
import { evaluateFormulaExpression } from './formula-evaluator'

export function validateFormValues(
  rules: ValidationRule[],
  values: Record<string, number | null>,
  previousValues: Record<string, number | null> = {},
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  for (const rule of rules) {
    const targetVal = values[rule.targetRowCode] ?? 0

    if (rule.type === 'formula_equals') {
      const calculatedExpected = evaluateFormulaExpression(rule.expression, values)
      // Допускаем погрешность округления 0.05
      const diff = Math.abs((targetVal ?? 0) - calculatedExpected)
      if (diff > 0.05) {
        issues.push({
          ruleId: rule.id,
          rowCode: rule.targetRowCode,
          message: rule.message,
          severity: rule.severity,
          actualValue: targetVal,
          expectedValue: calculatedExpected,
        })
      }
    } else if (rule.type === 'formula_gte') {
      const minExpected = evaluateFormulaExpression(rule.expression, values)
      if ((targetVal ?? 0) < minExpected - 0.01) {
        issues.push({
          ruleId: rule.id,
          rowCode: rule.targetRowCode,
          message: rule.message,
          severity: rule.severity,
          actualValue: targetVal,
          expectedValue: minExpected,
        })
      }
    } else if (rule.type === 'formula_lte') {
      const maxExpected = evaluateFormulaExpression(rule.expression, values)
      if ((targetVal ?? 0) > maxExpected + 0.01) {
        issues.push({
          ruleId: rule.id,
          rowCode: rule.targetRowCode,
          message: rule.message,
          severity: rule.severity,
          actualValue: targetVal,
          expectedValue: maxExpected,
        })
      }
    } else if (rule.type === 'max_decrease_percent') {
      const prevVal = previousValues[rule.targetRowCode]
      if (typeof prevVal === 'number' && prevVal > 0 && typeof targetVal === 'number' && targetVal >= 0) {
        const dropPercent = ((prevVal - targetVal) / prevVal) * 100
        const maxPercentThreshold = parseFloat(rule.expression) || 50
        if (dropPercent > maxPercentThreshold) {
          issues.push({
            ruleId: rule.id,
            rowCode: rule.targetRowCode,
            message: `${rule.message} (Снижение на ${dropPercent.toFixed(1)}%: было ${prevVal}, стало ${targetVal})`,
            severity: 'warning',
            actualValue: targetVal,
            expectedValue: prevVal,
          })
        }
      }
    }
  }

  return issues
}
