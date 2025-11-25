import { HttpStatus } from "@nestjs/common";
import MessariError from "src/errors/messari-error";

import type { LoggerService } from "@makebelieve21213-packages/logger";

// Абстрактный класс для работы с Messari API
export default abstract class CoreService {
	constructor(
		private readonly baseUrl: string,
		private readonly timeout: number,
		private readonly apiKey: string,
		protected readonly logger: LoggerService
	) {}

	protected async makeRequest<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
		const url = new URL(`${this.baseUrl}${endpoint}`);

		if (params) {
			Object.entries(params).forEach(([key, value]) => {
				if (value !== undefined && value !== null) {
					url.searchParams.append(key, String(value));
				}
			});
		}

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.timeout);

		try {
			const response = await fetch(url.toString(), {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					"x-messari-api-key": this.apiKey,
				},
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			const responseData = (await response.json()) as {
				data?: T;
				status?: { error_code?: number; error_message?: string };
			};

			const data = (responseData.data || responseData) as T;

			if (!response.ok) {
				const errorMessage =
					responseData.status?.error_message || `Messari API error: ${response.status}`;
				this.logger.error(`Messari API error: ${errorMessage}`);
				throw new MessariError(
					errorMessage,
					response.status >= HttpStatus.INTERNAL_SERVER_ERROR
						? HttpStatus.BAD_GATEWAY
						: HttpStatus.BAD_REQUEST
				);
			}

			return data;
		} catch (error: Error | unknown) {
			clearTimeout(timeoutId);

			if (error instanceof MessariError) {
				throw error;
			}

			if (error instanceof Error && error.name === "AbortError") {
				throw new MessariError("Request timeout", HttpStatus.REQUEST_TIMEOUT);
			}

			this.logger.error(
				`Messari API request failed: ${error instanceof Error ? error.message : String(error)}`
			);

			throw MessariError.fromError(error, "Failed to fetch data from Messari API");
		}
	}
}
