# АгроСтат

MVP информационной системы сбора сельскохозяйственной статистической отчётности.

## Структура

- `backend/AgroStat.Api` — REST API на ASP.NET Core.
- `frontend` — Telegram Mini App на Vue 3 + Vite.
- `bot` — Telegram-бот на Node.js, открывающий Mini App и выполняющий первичную идентификацию.

## Запуск локально

1. API: `dotnet run --project backend/AgroStat.Api`
2. Mini App: `cd frontend && npm install && npm run dev`
3. Бот: скопируйте `bot/.env.example` в `bot/.env`, заполните токен и URL, затем `cd bot && npm start`.

Для production нужно заменить `InMemoryAgroStatStore` на PostgreSQL-репозитории и добавить проверку Telegram `initData` на API.
