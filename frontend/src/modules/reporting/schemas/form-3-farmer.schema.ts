import type { FormSchema } from '@/shared/types'

export const form3FarmerSchema: FormSchema = {
  formCode: '3-фермер',
  title: 'Форма № 3-фермер: Отчет о производстве продукции животноводства и поголовье скота',
  periodType: 'quarterly',
  frequency: 'Ежеквартально (до 5 числа после отчетного периода)',
  sections: [
    {
      id: 'sec-livestock-1',
      code: 'I',
      title: '1. Поголовье скота и птицы на конец отчетного периода',
      description: 'Фактическое наличие животных в хозяйстве (в головах).',
      activityGroup: 'livestock',
      rows: [
        { code: '010', title: 'Крупный рогатый скот (КРС) – всего', unit: 'голов', valueType: 'integer' },
        { code: '011', title: 'в том числе: коровы', unit: 'голов', valueType: 'integer', indent: 1 },
        { code: '020', title: 'Свиньи – всего', unit: 'голов', valueType: 'integer' },
        { code: '021', title: 'в том числе: основные свиноматки', unit: 'голов', valueType: 'integer', indent: 1 },
        { code: '030', title: 'Овцы и козы – всего', unit: 'голов', valueType: 'integer' },
        { code: '040', title: 'Лошади – всего', unit: 'голов', valueType: 'integer' },
        { code: '050', title: 'Птица всех видов – всего', unit: 'голов', valueType: 'integer' },
        { code: '051', title: 'в том числе: куры-несушки', unit: 'голов', valueType: 'integer', indent: 1 },
      ],
    },
    {
      id: 'sec-livestock-2',
      code: 'II',
      title: '2. Производство продукции животноводства',
      description: 'Производство молока, яиц, шерсти и реализация скота на убой.',
      activityGroup: 'livestock',
      rows: [
        { code: '100', title: 'Произведено молока сырого коровьего', unit: 'ц', valueType: 'number', precision: 1 },
        { code: '110', title: 'Получено яиц от всех видов птицы', unit: 'тыс. шт', valueType: 'number', precision: 1 },
        { code: '120', title: 'Реализовано скота и птицы на убой (в живом весе)', unit: 'ц', valueType: 'number', precision: 1 },
        { code: '130', title: 'Настрижено шерсти овечьей', unit: 'кг', valueType: 'number', precision: 1 },
      ],
    },
  ],
  validationRules: [
    {
      id: 'val-cows-lte-cattle',
      type: 'formula_gte',
      targetRowCode: '010',
      expression: '011',
      message: 'Количество коров (стр. 011) не может превышать общее поголовье КРС (стр. 010).',
      severity: 'error',
    },
    {
      id: 'val-sows-lte-pigs',
      type: 'formula_gte',
      targetRowCode: '020',
      expression: '021',
      message: 'Количество свиноматок (стр. 021) не может превышать общее поголовье свиней (стр. 020).',
      severity: 'error',
    },
    {
      id: 'val-anom-cattle',
      type: 'max_decrease_percent',
      targetRowCode: '010',
      expression: '40',
      message: 'Подозрительное снижение: поголовье КРС сократилось более чем на 40% по сравнению с прошлым периодом.',
      severity: 'warning',
    },
  ],
}
