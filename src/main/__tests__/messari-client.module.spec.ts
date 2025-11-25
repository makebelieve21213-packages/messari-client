import { LoggerService } from "@makebelieve21213-packages/logger";
import { Module } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import MessariModule from "src/main/messari-client.module";
import MessariService from "src/main/messari-client.service";
import { MESSARI_CLIENT_OPTIONS } from "src/utils/injection-keys";

import type { MessariModuleOptions } from "src/types/module-options.interface";

// Мокируем LoggerService
const mockLoggerService = {
	log: jest.fn(),
	error: jest.fn(),
	warn: jest.fn(),
	debug: jest.fn(),
	verbose: jest.fn(),
	setContext: jest.fn(),
};

jest.mock("@makebelieve21213-packages/logger", () => ({
	LoggerService: jest.fn().mockImplementation(() => mockLoggerService),
}));

// Тестовый модуль для предоставления LoggerService
@Module({
	providers: [
		{
			provide: LoggerService,
			useValue: mockLoggerService,
		},
	],
	exports: [LoggerService],
})
class TestLoggerModule {}

describe("MessariModule", () => {
	describe("forRootAsync", () => {
		it("должен создать модуль с синхронной фабрикой", async () => {
			const options: MessariModuleOptions = {
				apiKey: "test-api-key",
				baseUrl: "https://data.messari.io/api/v1",
				timeout: 30000,
			};

			const module = await Test.createTestingModule({
				imports: [
					TestLoggerModule,
					MessariModule.forRootAsync({
						imports: [TestLoggerModule],
						useFactory: () => options,
					}),
				],
			}).compile();

			const service = module.get<MessariService>(MessariService);
			const optionsToken = module.get<MessariModuleOptions>(MESSARI_CLIENT_OPTIONS);

			expect(service).toBeInstanceOf(MessariService);
			expect(optionsToken).toEqual(options);
		});

		it("должен создать модуль с асинхронной фабрикой", async () => {
			const options: MessariModuleOptions = {
				apiKey: "test-api-key",
			};

			const module = await Test.createTestingModule({
				imports: [
					TestLoggerModule,
					MessariModule.forRootAsync({
						imports: [TestLoggerModule],
						useFactory: async () => {
							await new Promise((resolve) => setTimeout(resolve, 10));
							return options;
						},
					}),
				],
			}).compile();

			const service = module.get<MessariService>(MessariService);

			expect(service).toBeInstanceOf(MessariService);
		});

		it("должен создать модуль с inject зависимостями", async () => {
			const options: MessariModuleOptions = {
				apiKey: "test-api-key",
			};

			// Создаем отдельный модуль с провайдером для тестирования inject
			@Module({
				providers: [
					{
						provide: "TEST_CONFIG_TOKEN",
						useValue: options,
					},
				],
				exports: ["TEST_CONFIG_TOKEN"],
			})
			class TestConfigModule {}

			const module = await Test.createTestingModule({
				imports: [
					TestLoggerModule,
					TestConfigModule,
					MessariModule.forRootAsync({
						imports: [TestLoggerModule, TestConfigModule],
						useFactory: (injectedOptions: MessariModuleOptions) => injectedOptions,
						inject: ["TEST_CONFIG_TOKEN"],
					}),
				],
			}).compile();

			const service = module.get<MessariService>(MessariService);

			expect(service).toBeInstanceOf(MessariService);
		});

		it("должен создать модуль с imports", async () => {
			const options: MessariModuleOptions = {
				apiKey: "test-api-key",
			};

			const TestModule = class TestModule {};

			const module = await Test.createTestingModule({
				imports: [
					TestLoggerModule,
					MessariModule.forRootAsync({
						imports: [TestLoggerModule, TestModule],
						useFactory: () => options,
					}),
				],
			}).compile();

			const service = module.get<MessariService>(MessariService);

			expect(service).toBeInstanceOf(MessariService);
		});

		it("должен экспортировать MessariService", async () => {
			const options: MessariModuleOptions = {
				apiKey: "test-api-key",
			};

			const module = await Test.createTestingModule({
				imports: [
					TestLoggerModule,
					MessariModule.forRootAsync({
						imports: [TestLoggerModule],
						useFactory: () => options,
					}),
				],
			}).compile();

			const service = module.get<MessariService>(MessariService);

			expect(service).toBeDefined();
		});

		it("должен создать модуль без inject если не указан", async () => {
			const options: MessariModuleOptions = {
				apiKey: "test-api-key",
			};

			const module = await Test.createTestingModule({
				imports: [
					TestLoggerModule,
					MessariModule.forRootAsync({
						imports: [TestLoggerModule],
						useFactory: () => options,
					}),
				],
			}).compile();

			const service = module.get<MessariService>(MessariService);

			expect(service).toBeInstanceOf(MessariService);
		});

		it("должен использовать пустой массив для imports если не указан", async () => {
			const options: MessariModuleOptions = {
				apiKey: "test-api-key",
			};

			const dynamicModule = MessariModule.forRootAsync({
				useFactory: () => options,
			});

			expect(dynamicModule.imports).toEqual([]);
		});
	});
});
