import { HttpException, HttpStatus } from "@nestjs/common";

// Пользовательская ошибка для Messari API
export default class MessariError extends HttpException {
	constructor(
		readonly message: string,
		readonly statusCode: number = HttpStatus.BAD_GATEWAY
	) {
		super(message, statusCode);
		this.name = "MessariError";
	}

	// Преобразует ошибку из Error, HttpException или unknown в MessariError
	static fromError(error: Error | HttpException | unknown, defaultMessage?: string): MessariError {
		if (error instanceof MessariError) {
			return error;
		}

		if (error instanceof HttpException) {
			return new MessariError(
				error.message || defaultMessage || "Messari API error",
				error.getStatus()
			);
		}

		if (error instanceof Error) {
			return new MessariError(
				error.message || defaultMessage || "Messari API error",
				HttpStatus.BAD_GATEWAY
			);
		}

		return new MessariError(
			defaultMessage || String(error) || "Messari API error",
			HttpStatus.BAD_GATEWAY
		);
	}
}
