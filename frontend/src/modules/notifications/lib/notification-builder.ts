import type {
  AppNotification,
  FarmProfile,
  NotificationKind,
  NotificationSettings,
  ReportFormSettings,
  ReportUIModel,
} from '@/shared/types'

const DAY_MS = 86_400_000
const FEED_LIMIT = 50
// Для отчёта, который вообще не создан, просрочку показываем только первое время после срока
const MISSING_REPORT_OVERDUE_DAYS = 30
const PENDING_STATUSES: ReportUIModel['status'][] = ['draft', 'in_progress', 'ready_to_submit', 'needs_revision']

export const NOTIFICATION_TITLES: Record<NotificationKind, string> = {
  period_open: 'Открыт отчётный период',
  deadline_soon: 'Приближается срок сдачи',
  deadline_overdue: 'Срок сдачи истёк',
  submitted: 'Отчёт принят системой',
  approved: 'Отчёт принят статистикой',
  returned: 'Отчёт возвращён на уточнение',
}

export const NOTIFICATION_PLACEHOLDERS = ['form', 'period', 'deadline', 'days', 'number', 'comment'] as const

/**
 * Подставляет значения в шаблон. Предложение, в котором есть пустое значение
 * (например, нет номера или комментария), целиком пропускается.
 */
export function fillTemplate(template: string, values: Record<string, string>): string {
  const sentences = template.match(/[^.!?]+[.!?]*\s*/g) ?? [template]
  return sentences
    .filter((sentence) => Array.from(sentence.matchAll(/\{(\w+)\}/g)).every((match) => (values[match[1]] ?? '') !== ''))
    .map((sentence) => sentence.replace(/\{(\w+)\}/g, (_, name: string) => values[name] ?? ''))
    .join('')
    .trim()
}

function formatDate(date: Date): string {
  // «1 декабря 2026 г.» -> «1 декабря 2026 года»: точка в конце ломала бы знаки препинания в шаблонах
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).replace(/\s*г\.$/, ' года')
}

export interface NotificationContext {
  farm: FarmProfile
  reports: ReportUIModel[]
  formSettings: ReportFormSettings[]
  settings: NotificationSettings
  now?: Date
}

// Лента вычисляется из данных (отчёты, история, сроки форм), а не хранится: всегда соответствует текущему состоянию
export function buildNotifications(context: NotificationContext): AppNotification[] {
  const { farm, reports, formSettings, settings } = context
  const now = context.now ?? new Date()
  const items: AppNotification[] = []

  function add(
    kind: NotificationKind,
    id: string,
    createdAt: Date,
    values: Record<string, string>,
    extra: Pick<AppNotification, 'reportId' | 'formCode' | 'year'>,
  ): void {
    const rule = settings.rules[kind]
    if (!rule?.enabled) return
    const text = fillTemplate(rule.template, values)
    if (!text) return
    items.push({ id, kind, title: NOTIFICATION_TITLES[kind], text, createdAt: createdAt.toISOString(), ...extra })
  }

  // Открытие периода и сроки: по каждой назначенной активной форме за прошлый и текущий год
  for (const formCode of farm.assignedForms) {
    const form = formSettings.find((item) => item.formCode === formCode)
    if (!form?.isActive) continue

    for (const year of [now.getFullYear() - 1, now.getFullYear()]) {
      const start = new Date(year, form.submissionStartMonth - 1, form.submissionStartDay)
      const due = new Date(year + form.deadlineYearOffset, form.submissionDeadlineMonth - 1, form.submissionDeadlineDay, 23, 59, 59)
      if (start > now) continue

      const report = reports.find((item) => item.formCode === formCode && item.year === year)
      const daysLeft = Math.ceil((due.getTime() - now.getTime()) / DAY_MS)
      const values = {
        form: formCode,
        period: report?.period ?? `${year} год`,
        deadline: formatDate(due),
        days: String(Math.max(daysLeft, 0)),
        number: '',
        comment: '',
      }
      const extra = { reportId: report?.id, formCode, year }

      if (!report && due >= now) {
        add('period_open', `period_open:${formCode}:${year}`, start, values, extra)
      }

      if (report && !PENDING_STATUSES.includes(report.status)) continue
      if (daysLeft < 0) {
        if (report || -daysLeft <= MISSING_REPORT_OVERDUE_DAYS) {
          add('deadline_overdue', `deadline_overdue:${formCode}:${year}`, due, values, extra)
        }
      } else if (daysLeft <= settings.deadlineDays) {
        const reminderDate = new Date(Math.max(start.getTime(), due.getTime() - settings.deadlineDays * DAY_MS))
        add('deadline_soon', `deadline_soon:${formCode}:${year}`, reminderDate, values, extra)
      }
    }
  }

  // События по отчётам берём из истории
  for (const report of reports) {
    // Подряд идущие «отправлено» (повторный клик, старые данные) считаем одним событием
    const meaningful = report.history.filter((event) => event.action !== 'saved' && event.action !== 'created')
    for (const event of report.history) {
      if (event.action === 'submitted' && meaningful[meaningful.indexOf(event) - 1]?.action === 'submitted') continue
      const kind: NotificationKind | null =
        event.action === 'submitted' ? 'submitted' : event.action === 'approved' ? 'approved' : event.action === 'returned' ? 'returned' : null
      if (!kind) continue
      add(
        kind,
        `event:${event.id}`,
        new Date(event.createdAt),
        {
          form: report.formCode,
          period: report.period,
          deadline: '',
          days: '',
          number: report.registrationNumber ?? '',
          comment: event.comment ?? '',
        },
        { reportId: report.id, formCode: report.formCode, year: report.year },
      )
    }
  }

  return items.sort((first, second) => second.createdAt.localeCompare(first.createdAt)).slice(0, FEED_LIMIT)
}
