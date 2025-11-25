import { HttpException, HttpStatus } from "@nestjs/common";
import MessariError from "src/errors/messari-error";

describe("MessariError", () => {
	describe("constructor", () => {
		it("должен создать экземпляр MessariError с сообщением и статусом", () => {
			const error = new MessariError("Test error", HttpStatus.BAD_REQUEST);

			expect(error).toBeInstanceOf(MessariError);
			expect(error).toBeInstanceOf(HttpException);
			expect(error.message).toBe("Test error");
			expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
			expect(error.name).toBe("MessariError");
		});

		it("должен использовать дефолтный статус BAD_GATEWAY если не указан", () => {
			const error = new MessariError("Test error");

			expect(error.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
		});

		it("должен установить правильное имя ошибки", () => {
			const error = new MessariError("Test error");

			expect(error.name).toBe("MessariError");
		});
	});

	describe("fromError", () => {
		it("должен вернуть тот же экземпляр если передан MessariError", () => {
			const originalError = new MessariError("Original error", HttpStatus.BAD_REQUEST);
			const result = MessariError.fromError(originalError);

			expect(result).toBe(originalError);
			expect(result.message).toBe("Original error");
			expect(result.getStatus()).toBe(HttpStatus.BAD_REQUEST);
		});

		it("должен преобразовать HttpException в MessariError", () => {
			const httpException = new HttpException("HTTP error", HttpStatus.NOT_FOUND);
			const result = MessariError.fromError(httpException);

			expect(result).toBeInstanceOf(MessariError);
			expect(result.message).toBe("HTTP error");
			expect(result.getStatus()).toBe(HttpStatus.NOT_FOUND);
		});

		it("должен использовать defaultMessage для HttpException без сообщения", () => {
			const httpException = new HttpException("", HttpStatus.NOT_FOUND);
			const result = MessariError.fromError(httpException, "Default message");

			expect(result).toBeInstanceOf(MessariError);
			expect(result.message).toBe("Default message");
			expect(result.getStatus()).toBe(HttpStatus.NOT_FOUND);
		});

		it("должен использовать дефолтное сообщение для HttpException без сообщения и defaultMessage", () => {
			const httpException = new HttpException("", HttpStatus.NOT_FOUND);
			const result = MessariError.fromError(httpException);

			expect(result).toBeInstanceOf(MessariError);
			expect(result.message).toBe("Messari API error");
			expect(result.getStatus()).toBe(HttpStatus.NOT_FOUND);
		});

		it("должен преобразовать Error в MessariError", () => {
			const error = new Error("Standard error");
			const result = MessariError.fromError(error);

			expect(result).toBeInstanceOf(MessariError);
			expect(result.message).toBe("Standard error");
			expect(result.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
		});

		it("должен использовать defaultMessage для Error без сообщения", () => {
			const error = new Error("");
			const result = MessariError.fromError(error, "Default message");

			expect(result).toBeInstanceOf(MessariError);
			expect(result.message).toBe("Default message");
			expect(result.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
		});

		it("должен использовать дефолтное сообщение для Error без сообщения и defaultMessage", () => {
			const error = new Error("");
			const result = MessariError.fromError(error);

			expect(result).toBeInstanceOf(MessariError);
			expect(result.message).toBe("Messari API error");
			expect(result.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
		});

		it("должен преобразовать unknown (строка) в MessariError", () => {
			const unknownError = "String error";
			const result = MessariError.fromError(unknownError);

			expect(result).toBeInstanceOf(MessariError);
			expect(result.message).toBe("String error");
			expect(result.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
		});

		it("должен преобразовать unknown (число) в MessariError", () => {
			const unknownError = 123;
			const result = MessariError.fromError(unknownError);

			expect(result).toBeInstanceOf(MessariError);
			expect(result.message).toBe("123");
			expect(result.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
		});

		it("должен преобразовать unknown (null) в MessariError", () => {
			const unknownError = null;
			const result = MessariError.fromError(unknownError);

			expect(result).toBeInstanceOf(MessariError);
			expect(result.message).toBe("null");
			expect(result.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
		});

		it("должен преобразовать unknown (undefined) в MessariError", () => {
			const unknownError = undefined;
			const result = MessariError.fromError(unknownError);

			expect(result).toBeInstanceOf(MessariError);
			expect(result.message).toBe("undefined");
			expect(result.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
		});

		it("должен использовать defaultMessage для unknown", () => {
			const unknownError = null;
			const result = MessariError.fromError(unknownError, "Custom default message");

			expect(result).toBeInstanceOf(MessariError);
			expect(result.message).toBe("Custom default message");
			expect(result.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
		});

		it("должен использовать defaultMessage для unknown (строка) вместо String(error)", () => {
			const unknownError = "String error";
			const result = MessariError.fromError(unknownError, "Custom default message");

			expect(result).toBeInstanceOf(MessariError);
			expect(result.message).toBe("Custom default message");
			expect(result.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
		});

		it("должен использовать defaultMessage для unknown (число) вместо String(error)", () => {
			const unknownError = 123;
			const result = MessariError.fromError(unknownError, "Custom default message");

			expect(result).toBeInstanceOf(MessariError);
			expect(result.message).toBe("Custom default message");
			expect(result.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
		});

		it("должен использовать defaultMessage для unknown (объект) вместо String(error)", () => {
			const unknownError = { code: 500, message: "Server error" };
			const result = MessariError.fromError(unknownError, "Custom default message");

			expect(result).toBeInstanceOf(MessariError);
			expect(result.message).toBe("Custom default message");
			expect(result.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
		});

		it("должен использовать defaultMessage для unknown (undefined) вместо дефолтного сообщения", () => {
			const unknownError = undefined;
			const result = MessariError.fromError(unknownError, "Custom default message");

			expect(result).toBeInstanceOf(MessariError);
			expect(result.message).toBe("Custom default message");
			expect(result.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
		});

		it("должен преобразовать объект в MessariError", () => {
			const unknownError = { code: 500, message: "Server error" };
			const result = MessariError.fromError(unknownError);

			expect(result).toBeInstanceOf(MessariError);
			expect(result.message).toBe("[object Object]");
			expect(result.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
		});

		it("должен обработать Error с пустым сообщением и использовать defaultMessage", () => {
			const error = new Error();
			const result = MessariError.fromError(error, "Custom message");

			expect(result).toBeInstanceOf(MessariError);
			expect(result.message).toBe("Custom message");
		});

		it("должен использовать дефолтное сообщение когда String(error) возвращает пустую строку", () => {
			const emptyStringError = "";
			const result = MessariError.fromError(emptyStringError);

			expect(result).toBeInstanceOf(MessariError);
			expect(result.message).toBe("Messari API error");
			expect(result.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
		});
	});
});
