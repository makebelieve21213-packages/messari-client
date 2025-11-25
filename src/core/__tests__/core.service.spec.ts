import { LoggerService } from "@makebelieve21213-packages/logger";
import { HttpStatus } from "@nestjs/common";
import MessariBaseService from "src/core/core.service";
import MessariError from "src/errors/messari-error";

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

global.fetch = jest.fn();

class TestMessariService extends MessariBaseService {
	constructor(baseUrl: string, timeout: number, apiKey: string, logger: LoggerService) {
		super(baseUrl, timeout, apiKey, logger);
	}
}

describe("MessariBaseService", () => {
	let service: TestMessariService;
	let mockLogger: LoggerService;
	let mockFetch: jest.MockedFunction<typeof fetch>;

	beforeEach(() => {
		mockLogger = new LoggerService({} as { serviceName: string });
		mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
		mockFetch.mockClear();

		service = new TestMessariService(
			"https://data.messari.io/api/v1",
			30000,
			"test-api-key",
			mockLogger
		);

		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.clearAllMocks();
	});

	describe("makeRequest", () => {
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
					expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
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

			try {
				await (service as unknown as { makeRequest: <T>(endpoint: string) => Promise<T> }).makeRequest(
					"/test"
				);
				expect(true).toBe(false);
			} catch (error) {
				expect(error).toBeInstanceOf(MessariError);
				if (error instanceof MessariError) {
					expect(error.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
				}
			}
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
			mockFetch.mockRejectedValueOnce(new Error("Network error"));

			await expect(
				(service as unknown as { makeRequest: <T>(endpoint: string) => Promise<T> }).makeRequest(
					"/test"
				)
			).rejects.toThrow(MessariError);

			expect(mockLogger.error).toHaveBeenCalledWith("Messari API request failed: Network error");
		});

		it("должен логировать ошибку при ошибке не типа Error", async () => {
			mockFetch.mockRejectedValueOnce("String error");

			await expect(
				(service as unknown as { makeRequest: <T>(endpoint: string) => Promise<T> }).makeRequest(
					"/test"
				)
			).rejects.toThrow(MessariError);

			expect(mockLogger.error).toHaveBeenCalledWith("Messari API request failed: String error");
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

		it("должен успешно выполнить запрос и вернуть данные", async () => {
			const mockData = { data: [{ test: "data" }] };
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
	});
});
