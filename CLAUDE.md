# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Проект

«АгроСтат» — MVP системы сбора сельхоз-статотчётности (формы № 1/2/3-фермер) для службы статистики Приднестровья. UI и все тексты — на русском. Полное ТЗ лежит в `readme.ts` (это markdown, несмотря на расширение). Бэклог идей — `todo.md`. Исходные бланки форм — `Форма № N-фермер.doc(x)` в корне.

## Команды

- Фронтенд (из `frontend/`): `npm install`, `npm run dev`, `npm run build` (сначала `vue-tsc --noEmit`, так что это же и проверка типов), `npm run preview`.
- Бэкенд: `dotnet run --project backend/AgroStat.Api` (.NET 9).
- Тестов, линтера и роутера пока нет.

## Архитектура

**Фронтенд не ходит в бэкенд.** `frontend/src/api/http-client.ts` — мок-API: сид-данные (хозяйства, пользователи, отчёты) плюс хранение в `localStorage` под версионированными ключами (`agrostat_reports_v7` и т.п.). Если меняется форма DTO или сид, поднимайте версию ключа, иначе в браузере останутся старые данные. `backend/AgroStat.Api` (minimal API, `InMemoryAgroStatStore`) — отдельный заготовленный скелет, с фронтом не связан.

Демо-логины (пароль не проверяется): фермеры входят по фискальному коду (`0200034125`, `0200089452`, `0200011294`), а также есть `specialist_slobodzeya`, `specialist_center`, `admin`.

Структура `frontend/src` (алиас `@` → `src`):
- `api/` — DTO в snake_case и `httpClient`.
- `modules/{auth,reporting,review,admin}/` — у каждого модуля одинаковые слои: `adapters/` (DTO snake_case → UI-модель camelCase), `services/` (вызывают `httpClient` и адаптеры), `state/` (модульный `reactive` + хук `useXxxState()`; Pinia не используется), `ui/` (компоненты). Наружу всё отдаётся через `index.ts` модуля.
- `app/services/app-service.ts` — `AppService` оркестрирует модули: инициализация, логин/сессия (`agrostat_auth_user_id` в localStorage), загрузка данных под роль.
- `App.vue` — без роутера, экран выбирается по `currentUser.role`: `farmer` (дашборд + `FormWizard`), `specialist` (проверка отчётов, модуль review), `admin` (пользователи + настройки сроков форм).
- `shared/` — `types` (все доменные типы), `lib` (формулы, валидация, CSV-экспорт, форматирование), `ui` (базовые компоненты `App*`).

### Формы как данные

Отчётные формы описаны декларативно в `modules/reporting/schemas/form-N-farmer.schema.ts` и регистрируются в `registeredSchemas` по коду (`'1-фермер'` и т.д.). Секция формы содержит строки с трёхзначными кодами (`'001'`). Поле `activityGroup` (`crops`/`livestock`/`all`) определяет, какие секции видит хозяйство, в зависимости от его `activity_type`. Какие формы хозяйство сдаёт, задаёт `assigned_forms` у хозяйства.

- Расчётные строки: `isCalculated` + `calculationFormula`.
- Контроли: `validationRules` с типами `formula_equals|gte|lte`, `max_decrease_percent`, `required_if` и уровнем `error`/`warning`. Предупреждения фермер может подтвердить (`confirmedWarnings`).
- Формулы вычисляет `shared/lib/formula-evaluator.ts`: трёхзначные числа в выражении считаются кодами строк, а запись `sum(067:080)` раскрывается в диапазон. Поэтому числовые константы из трёх цифр в формулах писать нельзя.

Статусы отчёта: `draft → in_progress → ready_to_submit → submitted → needs_revision | approved`. Каждое действие пишется в `history`.
