# АгроСтат

MVP информационной системы сбора сельскохозяйственной статистической отчётности.

## Структура

- `backend/AgroStat.Api` — REST API на ASP.NET Core.
- `frontend` — веб-приложение на Vue 3 + Vite.

## Запуск локально

1. API: `dotnet run --project backend/AgroStat.Api`
2. Веб-приложение: `cd frontend && npm install && npm run dev`

Для production нужно заменить `InMemoryAgroStatStore` на PostgreSQL-репозитории и добавить полноценную аутентификацию пользователей на API.
