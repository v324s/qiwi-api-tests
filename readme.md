# QIWI API Tests

Тесты для API на основе [документации](https://developer.qiwi.com/ru/payout/v1/#about)

## 📁 Структура проекта

- `postman/` - Коллекция Postman
- `playwright/` - Тесты на Playwright
- `README.md` - Документация

## 🚀 Запуск тестов

### Postman
1. Импортируйте коллекцию `qiwi-payout-tests.postman_collection.json`
2. Запустите коллекцию

### Playwright
```bash
cd playwright
npm install
npm test
```