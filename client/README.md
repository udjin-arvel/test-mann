# Sqoch — оформление билетов (frontend)

Интерфейс покупки билетов. Данные и бронирование — через FastAPI-бэкенд (`/api/*`, прокси в `vite.config.ts`).

## Запуск

Сначала запустите бэкенд (см. корневой [README.md](../README.md)), затем:

```bash
npm install
npm run dev      # http://localhost:8080
npm run test     # тесты бизнес-правил и роутинга
```

Переменная `API_PROXY_TARGET` (по умолчанию `http://127.0.0.1:8000`) задаёт адрес API для dev-прокси.

## Структура

- `src/lib/tickets.ts` — правила: цены, возрастные пороги, валидация (`tickets.test.ts`).
- `src/lib/api.ts` — запросы к бэкенду.
- `src/components/checkout/*` — шаги оформления.
- `src/routes/index.tsx` — состояние и переходы между шагами.
