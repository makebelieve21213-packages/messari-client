import type { InjectionToken, ModuleMetadata, OptionalFactoryDependency } from "@nestjs/common";

// Опции конфигурации для Messari Client модуля
export interface MessariModuleOptions {
	// API ключ Messari (обязательно)
	apiKey: string;
	// Базовый URL API (по умолчанию https://data.messari.io/api/v1)
	baseUrl?: string;
	// Таймаут запросов в миллисекундах (по умолчанию 30000)
	timeout?: number;
}

// Тип для функции фабрики с динамическими аргументами
type MessariModuleOptionsFactory<T extends unknown[] = []> = (
	...args: T
) => Promise<MessariModuleOptions> | MessariModuleOptions;

// Асинхронные опции для динамической конфигурации модуля через useFactory
export interface MessariModuleAsyncOptions<T extends unknown[] = []>
	extends Pick<ModuleMetadata, "imports"> {
	useFactory: MessariModuleOptionsFactory<T>;
	inject?: (InjectionToken | OptionalFactoryDependency)[];
}
