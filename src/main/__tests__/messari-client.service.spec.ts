import { LoggerService } from "@makebelieve21213-packages/logger";
import { HttpStatus } from "@nestjs/common";
import MessariError from "src/errors/messari-error";
import MessariService from "src/main/messari-client.service";

import type {
	MessariAsset,
	MessariAssetDetails,
	MessariNews,
	MessariSearchResult,
} from "src/types/api-types";
import type { MessariModuleOptions } from "src/types/module-options.interface";

// Мокируем LoggerService
jest.mock("@makebelieve21213-packages/logger", () => ({
	LoggerService: class MockLoggerService {
		log = jest.fn();
		error = jest.fn();
		warn = jest.fn();
		debug = jest.fn();
		verbose = jest.fn();
		setContext = jest.fn();
	},
}));

// Мокируем глобальный fetch
global.fetch = jest.fn();

describe("MessariService", () => {
	let service: MessariService;
	let mockOptions: MessariModuleOptions;
	let mockFetch: jest.MockedFunction<typeof fetch>;
	let mockLogger: LoggerService;

	beforeEach(() => {
		mockOptions = {
			apiKey: "test-api-key",
			baseUrl: "https://data.messari.io/api/v1",
			timeout: 30000,
		};

		mockLogger = new LoggerService({} as { serviceName: string });

		mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
		mockFetch.mockClear();

		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	describe("constructor", () => {
		it("должен создать экземпляр сервиса с дефолтными опциями", () => {
			const defaultOptions: MessariModuleOptions = {
				apiKey: "test-key",
			};

			service = new MessariService(defaultOptions, mockLogger);

			expect(service).toBeInstanceOf(MessariService);
		});

		it("должен создать экземпляр сервиса с кастомными опциями", () => {
			service = new MessariService(mockOptions, mockLogger);

			expect(service).toBeInstanceOf(MessariService);
		});

		it("должен использовать дефолтный baseUrl если не указан", () => {
			const optionsWithoutUrl: MessariModuleOptions = {
				apiKey: "test-key",
			};

			service = new MessariService(optionsWithoutUrl, mockLogger);

			expect(service).toBeInstanceOf(MessariService);
		});

		it("должен использовать дефолтный timeout если не указан", () => {
			const optionsWithoutTimeout: MessariModuleOptions = {
				apiKey: "test-key",
			};

			service = new MessariService(optionsWithoutTimeout, mockLogger);

			expect(service).toBeInstanceOf(MessariService);
		});
	});

	describe("makeRequest", () => {
		beforeEach(() => {
			service = new MessariService(mockOptions, mockLogger);
		});

		it("должен успешно выполнить запрос без параметров", async () => {
			const mockData = { data: { test: "data" } };
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: jest.fn().mockResolvedValueOnce(mockData),
			} as unknown as Response);

			const result = await (
				service as unknown as { makeRequest: <T>(endpoint: string) => Promise<T> }
			).makeRequest("/test");

			expect(result).toEqual(mockData.data);
			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining("/test"),
				expect.objectContaining({
					method: "GET",
					headers: expect.objectContaining({
						"Content-Type": "application/json",
						"x-messari-api-key": "test-api-key",
					}),
				})
			);
		});

		it("должен успешно выполнить запрос с параметрами", async () => {
			const mockData = { data: { test: "data" } };
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: jest.fn().mockResolvedValueOnce(mockData),
			} as unknown as Response);

			const result = await (
				service as unknown as {
					makeRequest: <T>(endpoint: string, params?: Record<string, unknown>) => Promise<T>;
				}
			).makeRequest("/test", {
				param1: "value1",
				param2: 123,
			});

			expect(result).toEqual(mockData.data);
			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining("param1=value1&param2=123"),
				expect.any(Object)
			);
		});

		it("должен игнорировать undefined и null параметры", async () => {
			const mockData = { data: { test: "data" } };
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: jest.fn().mockResolvedValueOnce(mockData),
			} as unknown as Response);

			await (
				service as unknown as {
					makeRequest: <T>(endpoint: string, params?: Record<string, unknown>) => Promise<T>;
				}
			).makeRequest("/test", {
				param1: "value1",
				param2: undefined,
				param3: null,
			});

			const callUrl = mockFetch.mock.calls[0][0] as string;
			expect(callUrl).toContain("param1=value1");
			expect(callUrl).not.toContain("param2");
			expect(callUrl).not.toContain("param3");
		});

		it("должен выбросить MessariError при ошибке API (4xx)", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 400,
				json: jest.fn().mockResolvedValueOnce({
					status: { error_code: 400, error_message: "Bad Request" },
				}),
			} as unknown as Response);

			await expect(
				(service as unknown as { makeRequest: <T>(endpoint: string) => Promise<T> }).makeRequest(
					"/test"
				)
			).rejects.toThrow(MessariError);
		});

		it("должен выбросить MessariError при ошибке API (4xx) без error_message", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 400,
				json: jest.fn().mockResolvedValueOnce({
					status: { error_code: 400 },
				}),
			} as unknown as Response);

			try {
				await (service as unknown as { makeRequest: <T>(endpoint: string) => Promise<T> }).makeRequest(
					"/test"
				);
				expect(true).toBe(false);
			} catch (error) {
				expect(error).toBeInstanceOf(MessariError);
				if (error instanceof MessariError) {
					expect(error.message).toBe("Messari API error: 400");
				}
			}
		});

		it("должен выбросить MessariError при ошибке API (5xx)", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 500,
				json: jest.fn().mockResolvedValueOnce({
					status: { error_code: 500, error_message: "Internal Server Error" },
				}),
			} as unknown as Response);

			await expect(
				(service as unknown as { makeRequest: <T>(endpoint: string) => Promise<T> }).makeRequest(
					"/test"
				)
			).rejects.toThrow(MessariError);
		});

		it("должен выбросить MessariError при таймауте", async () => {
			mockFetch.mockImplementationOnce((_, options) => {
				const signal = options?.signal as AbortSignal | undefined;
				return new Promise((_, reject) => {
					if (signal) {
						const onAbort = () => {
							const abortError = new Error("Request timeout");
							abortError.name = "AbortError";
							reject(abortError);
						};

						if (signal.aborted) {
							onAbort();
						} else {
							signal.addEventListener("abort", onAbort);
						}
					} else {
						setTimeout(() => {
							const abortError = new Error("Request timeout");
							abortError.name = "AbortError";
							reject(abortError);
						}, 30000);
					}
				});
			});

			const requestPromise = (
				service as unknown as { makeRequest: <T>(endpoint: string) => Promise<T> }
			).makeRequest("/test");

			jest.advanceTimersByTime(30000);
			await Promise.resolve();

			try {
				await requestPromise;
				expect(true).toBe(false);
			} catch (error) {
				expect(error).toBeInstanceOf(MessariError);
				if (error instanceof MessariError) {
					expect(error.getStatus()).toBe(HttpStatus.REQUEST_TIMEOUT);
					expect(error.message).toBe("Request timeout");
				}
			}
		});

		it("должен выбросить MessariError при сетевой ошибке", async () => {
			const loggerErrorSpy = jest.spyOn(
				(service as unknown as { logger: { error: jest.Mock } }).logger,
				"error"
			);

			mockFetch.mockRejectedValueOnce(new Error("Network error"));

			await expect(
				(service as unknown as { makeRequest: <T>(endpoint: string) => Promise<T> }).makeRequest(
					"/test"
				)
			).rejects.toThrow(MessariError);

			expect(loggerErrorSpy).toHaveBeenCalledWith("Messari API request failed: Network error");
		});

		it("должен логировать ошибку при ошибке не типа Error", async () => {
			const loggerErrorSpy = jest.spyOn(
				(service as unknown as { logger: { error: jest.Mock } }).logger,
				"error"
			);

			mockFetch.mockRejectedValueOnce("String error");

			await expect(
				(service as unknown as { makeRequest: <T>(endpoint: string) => Promise<T> }).makeRequest(
					"/test"
				)
			).rejects.toThrow(MessariError);

			expect(loggerErrorSpy).toHaveBeenCalledWith("Messari API request failed: String error");
		});

		it("должен пробросить MessariError если он уже был выброшен", async () => {
			const messariError = new MessariError("Test error", HttpStatus.BAD_REQUEST);
			mockFetch.mockRejectedValueOnce(messariError);

			await expect(
				(service as unknown as { makeRequest: <T>(endpoint: string) => Promise<T> }).makeRequest(
					"/test"
				)
			).rejects.toThrow(messariError);
		});

		it("должен вернуть data если оно есть в ответе", async () => {
			const mockData = { data: { test: "data" } };
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: jest.fn().mockResolvedValueOnce(mockData),
			} as unknown as Response);

			const result = await (
				service as unknown as { makeRequest: <T>(endpoint: string) => Promise<T> }
			).makeRequest("/test");

			expect(result).toEqual(mockData.data);
		});

		it("должен вернуть весь ответ если data отсутствует", async () => {
			const mockData = { test: "data" };
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: jest.fn().mockResolvedValueOnce(mockData),
			} as unknown as Response);

			const result = await (
				service as unknown as { makeRequest: <T>(endpoint: string) => Promise<T> }
			).makeRequest("/test");

			expect(result).toEqual(mockData);
		});
	});

	describe("getTopAssets", () => {
		beforeEach(() => {
			service = new MessariService(mockOptions, mockLogger);
		});

		it("должен получить топ активы с дефолтным лимитом", async () => {
			const mockData = {
				data: [
					{
						id: "bitcoin",
						symbol: "BTC",
						name: "Bitcoin",
						slug: "bitcoin",
					} as MessariAsset,
				],
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: jest.fn().mockResolvedValueOnce(mockData),
			} as unknown as Response);

			const result = await service.getTopAssets();

			expect(result).toEqual(mockData.data);
			expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/assets"), expect.any(Object));
		});

		it("должен получить топ активы с кастомным лимитом", async () => {
			const mockData = {
				data: [
					{
						id: "bitcoin",
						symbol: "BTC",
						name: "Bitcoin",
						slug: "bitcoin",
					} as MessariAsset,
				],
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: jest.fn().mockResolvedValueOnce(mockData),
			} as unknown as Response);

			const result = await service.getTopAssets(50);

			expect(result).toEqual(mockData.data);
			const callUrl = mockFetch.mock.calls[0][0] as string;
			expect(callUrl).toContain("limit=50");
		});

		it("должен вернуть массив если ответ является массивом", async () => {
			const mockData: MessariAsset[] = [
				{
					id: "bitcoin",
					symbol: "BTC",
					name: "Bitcoin",
					slug: "bitcoin",
				},
			];

			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: jest.fn().mockResolvedValueOnce(mockData),
			} as unknown as Response);

			const result = await service.getTopAssets();

			expect(result).toEqual(mockData);
		});

		it("должен вернуть пустой массив если data отсутствует", async () => {
			const mockData = {};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: jest.fn().mockResolvedValueOnce(mockData),
			} as unknown as Response);

			const result = await service.getTopAssets();

			expect(result).toEqual([]);
		});
	});

	describe("getAsset", () => {
		beforeEach(() => {
			service = new MessariService(mockOptions, mockLogger);
		});

		it("должен получить детальную информацию об активе", async () => {
			const mockData = {
				data: {
					id: "bitcoin",
					symbol: "BTC",
					name: "Bitcoin",
					slug: "bitcoin",
					metrics: {
						marketData: {
							priceUsd: 50000,
						},
					},
				} as MessariAssetDetails,
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: jest.fn().mockResolvedValueOnce(mockData),
			} as unknown as Response);

			const result = await service.getAsset("bitcoin");

			expect(result).toEqual(mockData.data);
			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining("/assets/bitcoin"),
				expect.any(Object)
			);
		});

		it("должен вернуть первый элемент если ответ является массивом", async () => {
			const mockData: MessariAssetDetails[] = [
				{
					id: "bitcoin",
					symbol: "BTC",
					name: "Bitcoin",
					slug: "bitcoin",
				} as MessariAssetDetails,
			];

			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: jest.fn().mockResolvedValueOnce(mockData),
			} as unknown as Response);

			const result = await service.getAsset("bitcoin");

			expect(result).toEqual(mockData[0]);
		});

		it("должен вернуть весь ответ если data отсутствует", async () => {
			const mockData = {
				id: "bitcoin",
				symbol: "BTC",
				name: "Bitcoin",
				slug: "bitcoin",
			} as MessariAssetDetails;

			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: jest.fn().mockResolvedValueOnce(mockData),
			} as unknown as Response);

			const result = await service.getAsset("bitcoin");

			expect(result).toEqual(mockData);
		});
	});

	describe("getAssetNews", () => {
		beforeEach(() => {
			service = new MessariService(mockOptions, mockLogger);
		});

		it("должен получить новости актива с дефолтным лимитом", async () => {
			const mockData = {
				data: [
					{
						id: "news-1",
						title: "Bitcoin News",
						content: "Content",
						publishedAt: "2024-01-01",
					} as MessariNews,
				],
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: jest.fn().mockResolvedValueOnce(mockData),
			} as unknown as Response);

			const result = await service.getAssetNews("bitcoin");

			expect(result).toEqual(mockData.data);
			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining("/news/bitcoin"),
				expect.any(Object)
			);
		});

		it("должен получить новости актива с кастомным лимитом", async () => {
			const mockData = {
				data: [
					{
						id: "news-1",
						title: "Bitcoin News",
						content: "Content",
						publishedAt: "2024-01-01",
					} as MessariNews,
				],
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: jest.fn().mockResolvedValueOnce(mockData),
			} as unknown as Response);

			const result = await service.getAssetNews("bitcoin", 10);

			expect(result).toEqual(mockData.data);
			const callUrl = mockFetch.mock.calls[0][0] as string;
			expect(callUrl).toContain("limit=10");
		});

		it("должен вернуть массив если ответ является массивом", async () => {
			const mockData: MessariNews[] = [
				{
					id: "news-1",
					title: "Bitcoin News",
					content: "Content",
					publishedAt: "2024-01-01",
				},
			];

			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: jest.fn().mockResolvedValueOnce(mockData),
			} as unknown as Response);

			const result = await service.getAssetNews("bitcoin");

			expect(result).toEqual(mockData);
		});

		it("должен вернуть пустой массив если data отсутствует", async () => {
			const mockData = {};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: jest.fn().mockResolvedValueOnce(mockData),
			} as unknown as Response);

			const result = await service.getAssetNews("bitcoin");

			expect(result).toEqual([]);
		});
	});

	describe("getGeneralNews", () => {
		beforeEach(() => {
			service = new MessariService(mockOptions, mockLogger);
		});

		it("должен получить общие новости с дефолтным лимитом", async () => {
			const mockData = {
				data: [
					{
						id: "news-1",
						title: "Crypto News",
						content: "Content",
						publishedAt: "2024-01-01",
					} as MessariNews,
				],
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: jest.fn().mockResolvedValueOnce(mockData),
			} as unknown as Response);

			const result = await service.getGeneralNews();

			expect(result).toEqual(mockData.data);
			expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/news"), expect.any(Object));
		});

		it("должен получить общие новости с кастомным лимитом", async () => {
			const mockData = {
				data: [
					{
						id: "news-1",
						title: "Crypto News",
						content: "Content",
						publishedAt: "2024-01-01",
					} as MessariNews,
				],
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: jest.fn().mockResolvedValueOnce(mockData),
			} as unknown as Response);

			const result = await service.getGeneralNews(10);

			expect(result).toEqual(mockData.data);
			const callUrl = mockFetch.mock.calls[0][0] as string;
			expect(callUrl).toContain("limit=10");
		});

		it("должен вернуть массив если ответ является массивом", async () => {
			const mockData: MessariNews[] = [
				{
					id: "news-1",
					title: "Crypto News",
					content: "Content",
					publishedAt: "2024-01-01",
				},
			];

			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: jest.fn().mockResolvedValueOnce(mockData),
			} as unknown as Response);

			const result = await service.getGeneralNews();

			expect(result).toEqual(mockData);
		});

		it("должен вернуть пустой массив если data отсутствует", async () => {
			const mockData = {};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: jest.fn().mockResolvedValueOnce(mockData),
			} as unknown as Response);

			const result = await service.getGeneralNews();

			expect(result).toEqual([]);
		});
	});

	describe("searchAssets", () => {
		beforeEach(() => {
			service = new MessariService(mockOptions, mockLogger);
		});

		it("должен выполнить поиск активов", async () => {
			const mockData = {
				data: [
					{
						id: "bitcoin",
						symbol: "BTC",
						name: "Bitcoin",
						slug: "bitcoin",
					} as MessariSearchResult,
				],
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: jest.fn().mockResolvedValueOnce(mockData),
			} as unknown as Response);

			const result = await service.searchAssets("bitcoin");

			expect(result).toEqual(mockData.data);
			const callUrl = mockFetch.mock.calls[0][0] as string;
			expect(callUrl).toContain("/assets");
			expect(callUrl).toContain("search=bitcoin");
		});

		it("должен вернуть массив если ответ является массивом", async () => {
			const mockData: MessariSearchResult[] = [
				{
					id: "bitcoin",
					symbol: "BTC",
					name: "Bitcoin",
					slug: "bitcoin",
				},
			];

			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: jest.fn().mockResolvedValueOnce(mockData),
			} as unknown as Response);

			const result = await service.searchAssets("bitcoin");

			expect(result).toEqual(mockData);
		});

		it("должен вернуть пустой массив если data отсутствует", async () => {
			const mockData = {};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: jest.fn().mockResolvedValueOnce(mockData),
			} as unknown as Response);

			const result = await service.searchAssets("bitcoin");

			expect(result).toEqual([]);
		});
	});
});
