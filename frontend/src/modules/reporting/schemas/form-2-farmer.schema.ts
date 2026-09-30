import type { FormSchema } from '@/shared/types'

export const form2FarmerSchema: FormSchema = {
  formCode: '2-фермер',
  title: 'Форма № 2-фермер: Отчет о сборе урожая сельскохозяйственных культур',
  periodType: 'annual',
  frequency: '1 раз в год (до 1 декабря)',
  sections: [
    {
      id: 'sec-harvest-1',
      code: 'I',
      title: '1. Сбор урожая зерновых и зернобобовых культур',
      description: 'Убранная площадь (га) и валовой сбор (центнеров) в первоначально оприходованном весе.',
      activityGroup: 'crops',
      rows: [
        { code: '010', title: 'Зерновые и зернобобовые – убранная площадь', unit: 'га', valueType: 'number', precision: 1 },
        { code: '011', title: 'Зерновые и зернобобовые – валовой сбор', unit: 'ц', valueType: 'number', precision: 1 },
        { code: '020', title: 'в т.ч. Пшеница озимая и яровая – убранная площадь', unit: 'га', valueType: 'number', precision: 1, indent: 1 },
        { code: '021', title: 'в т.ч. Пшеница – валовой сбор', unit: 'ц', valueType: 'number', precision: 1, indent: 1 },
        { code: '030', title: 'Кукуруза на зерно – убранная площадь', unit: 'га', valueType: 'number', precision: 1, indent: 1 },
        { code: '031', title: 'Кукуруза на зерно – валовой сбор', unit: 'ц', valueType: 'number', precision: 1, indent: 1 },
      ],
    },
    {
      id: 'sec-harvest-2',
      code: 'II',
      title: '2. Сбор урожая технических культур, овощей и плодов',
      description: 'Подсолнечник, овощи открытого грунта, сады и виноградники.',
      activityGroup: 'crops',
      rows: [
        { code: '040', title: 'Подсолнечник – убранная площадь', unit: 'га', valueType: 'number', precision: 1 },
        { code: '041', title: 'Подсолнечник – валовой сбор', unit: 'ц', valueType: 'number', precision: 1 },
        { code: '050', title: 'Овощи открытого грунта – убранная площадь', unit: 'га', valueType: 'number', precision: 1 },
        { code: '051', title: 'Овощи открытого грунта – валовой сбор', unit: 'ц', valueType: 'number', precision: 1 },
        { code: '060', title: 'Плоды косточковые и семечковые – валовой сбор', unit: 'ц', valueType: 'number', precision: 1 },
        { code: '070', title: 'Виноградники – валовой сбор', unit: 'ц', valueType: 'number', precision: 1 },
      ],
    },
  ],
  validationRules: [
    {
      id: 'val-wheat-area',
      type: 'formula_gte',
      targetRowCode: '010',
      expression: '020 + 030',
      message: 'Общая убранная площадь зерновых (стр. 010) не может быть меньше суммы пшеницы (020) и кукурузы (030).',
      severity: 'error',
    },
  ],
}
