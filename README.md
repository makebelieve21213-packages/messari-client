# @packages/messari-client

Messari API клиент для NestJS с поддержкой TypeScript и полной типобезопасностью.

## 📋 Содержание

- [Возможности](#-возможности)
- [Требования](#-требования)
- [Установка](#-установка)
- [Структура пакета](#-структура-пакета)
- [Быстрый старт](#-быстрый-старт)
- [API Reference](#-api-reference)
- [Примеры использования](#-примеры-использования)
- [Troubleshooting](#-troubleshooting)
- [Тестирование](#-тестирование)

## 🚀 Возможности

- ✅ **NestJS интеграция** - глобальный модуль с forRootAsync для простой интеграции
- ✅ **Type-safe API** - полная типобезопасность TypeScript с экспортируемыми типами
- ✅ **HTTP клиент** - использование нативного fetch API с поддержкой таймаутов
- ✅ **Конфигурация** - поддержка API ключа через ConfigModule (обязательно)
- ✅ **Обработка ошибок** - детальная обработка ошибок API с логированием
- ✅ **100% покрытие тестами** - надежность и качество кода

## 📋 Требования

- **Node.js**: >= 22.11.0
- **NestJS**: >= 11.0.0

## 📦 Установка

```bash
npm install @packages/messari-client
```

### Зависимости

```json
{
  "@nestjs/common": "^11.0.0",
  "@nestjs/config": "^11.0.0",
  "@makebelieve21213-packages/logger": "^1.0.0",
  "reflect-metadata": "^0.1.13 || ^0.2.0"
}
```

## 📁 Структура пакета

```
src/
├── main/                    # NestJS модуль
├── types/                   # TypeScript типы
├── utils/                   # Утилиты
└── index.ts                 # Экспорты
```

## 🏗️ Архитектура

Пакет предоставляет NestJS глобальный модуль `MessariModule` для работы с Messari API через HTTP запросы.

**Основные компоненты:**
- `MessariModule` - NestJS глобальный модуль
- `MessariService` - сервис для работы с API
- `MessariModuleOptions` - конфигурация клиента
- Типы: `MessariAsset`, `MessariAssetDetails`, `MessariNews`, `MessariSearchResult`

## 🔧 Быстрый старт

### Шаг 1: Настройка переменных окружения

```env
MESSARI_API_KEY=your-api-key-here  # Обязательно
MESSARI_BASE_URL=https://data.messari.io/api/v1  # Опционально
MESSARI_TIMEOUT=30000  # Опционально
```

### Шаг 2: Создание конфигурации

Создайте файл `messari.config.ts` в вашем сервисе:

```typescript
import { registerAs } from "@nestjs/config";
import type { MessariModuleOptions } from "@packages/messari-client";
import { EnvVariable } from "src/types/enums";

export type MessariConfiguration = MessariModuleOptions;

const messariConfig = registerAs<MessariConfiguration>(
  "messari",
  (): MessariConfiguration => {
    const apiKey = process.env[EnvVariable.MESSARI_API_KEY];
    
    if (!apiKey) {
      throw new Error("MESSARI_API_KEY is required");
    }
    
    return {
      apiKey,
      baseUrl: process.env[EnvVariable.MESSARI_BASE_URL] || "https://data.messari.io/api/v1",
      timeout: Number(process.env[EnvVariable.MESSARI_TIMEOUT]) || 30000,
    };
  },
);

export default messariConfig;
```

### Шаг 3: Регистрация модуля

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MessariModule } from '@packages/messari-client';
import messariConfig from 'src/configs/messari.config';
import type { MessariConfiguration } from 'src/configs/messari.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [messariConfig],
    }),
    MessariModule.forRootAsync<[MessariConfiguration]>({
      useFactory: (config: MessariConfiguration) => config,
      inject: [messariConfig.KEY],
      imports: [ConfigModule],
    }),
  ],
})
export class AppModule {}
```

### Шаг 4: Использование сервиса

```typescript
// crypto-data.service.ts
import { Injectable } from '@nestjs/common';
import { MessariService } from '@packages/messari-client';
import type { MessariAsset } from '@packages/messari-client';

@Injectable()
export class CryptoDataService {
  constructor(private readonly messari: MessariService) {}

  async getTopCryptoAssets(limit: number = 100): Promise<MessariAsset[]> {
    return await this.messari.getTopAssets(limit);
  }
}
```

## 📚 API Reference

### MessariModule

**forRootAsync(options):**

```typescript
MessariModule.forRootAsync<[MessariConfiguration]>({
  useFactory: (config: MessariConfiguration) => config,
  inject: [messariConfig.KEY],
  imports: [ConfigModule],
})
```

**Экспортирует:** `MessariService` (глобально)

### MessariService

**Конфигурация:**
- `apiKey: string` - API ключ (обязательно)
- `baseUrl?: string` - базовый URL (по умолчанию: https://data.messari.io/api/v1)
- `timeout?: number` - таймаут запросов в мс (по умолчанию: 30000)

**Методы:**

#### `getTopAssets(limit?)`

Получает список топ криптовалютных активов с ограничением по количеству.

```typescript
async getTopAssets(limit?: number): Promise<MessariAsset[]>
```

**Параметры:** `limit` - количество активов (по умолчанию: 100)

#### `getAsset(assetKey)`

Получает детальную информацию об активе включая метрики и профиль.

```typescript
getAsset(assetKey: string): Promise<MessariAssetDetails>
```

#### `getAssetNews(assetKey, limit?)`

Получает новости связанные с конкретным активом.

```typescript
getAssetNews(assetKey: string, limit?: number): Promise<MessariNews[]>
```

#### `getGeneralNews(limit?)`

Получает общие новости криптовалютного рынка.

```typescript
getGeneralNews(limit?: number): Promise<MessariNews[]>
```

#### `searchAssets(query)`

Выполняет поиск активов по запросу.

```typescript
async searchAssets(query: string): Promise<MessariSearchResult[]>
```

## 🧪 Примеры использования

### Получение топ криптовалют

```typescript
const topAssets = await this.messari.getTopAssets(50);
topAssets.forEach(asset => {
  console.log(`${asset.name}: $${asset.metrics?.marketData?.priceUsd}`);
  console.log(`Market Cap: $${asset.metrics?.marketcap?.currentMarketcapUsd}`);
});
```

### Получение детальной информации

```typescript
const btcDetails = await this.messari.getAsset('bitcoin');
console.log(`Name: ${btcDetails.name}`);
console.log(`Price: $${btcDetails.metrics?.marketData?.priceUsd}`);
console.log(`Tagline: ${btcDetails.profile?.general?.overview?.tagline}`);
```

### Получение новостей

```typescript
// Новости актива
const assetNews = await this.messari.getAssetNews('bitcoin', 10);

// Общие новости
const generalNews = await this.messari.getGeneralNews(20);

// Поиск активов
const searchResults = await this.messari.searchAssets('bitcoin');
```

## 🚨 Troubleshooting

### Request timeout

**Решение:** Увеличить `MESSARI_TIMEOUT`, проверить интернет-соединение.

### API key not found

**Решение:** Убедиться, что `MESSARI_API_KEY` установлен в переменных окружения и передается в конфигурацию.

### Asset not found

**Решение:** Проверить правильность assetKey (нижний регистр), использовать `searchAssets()` для поиска.

## 🧪 Тестирование

Пакет имеет **100% покрытие тестами**.

```bash
pnpm test                # Все тесты
pnpm test:coverage       # С покрытием
pnpm test:watch          # Watch режим
```

## 🔧 Конфигурация

```typescript
interface MessariModuleOptions {
  apiKey: string;          // API ключ (обязательно)
  baseUrl?: string;        // Базовый URL (опционально)
  timeout?: number;        // Таймаут в мс (опционально)
}
```

**Примечание:** Конфигурация должна создаваться в сервисе, который использует пакет.

## 📦 Зависимости

- `@nestjs/common` - NestJS core
- `@nestjs/config` - NestJS config
- `@makebelieve21213-packages/logger` - Логирование
- `reflect-metadata` - TypeScript decorators

## 📄 Лицензия

MIT License

## 👥 Автор

Skryabin Aleksey
