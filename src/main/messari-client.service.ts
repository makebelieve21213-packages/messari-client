import { LoggerService } from "@makebelieve21213-packages/logger";
import { Injectable, Inject } from "@nestjs/common";
import CoreService from "src/core/core.service";
import { MESSARI_CLIENT_OPTIONS } from "src/utils/injection-keys";

import type {
	MessariAsset,
	MessariAssetDetails,
	MessariNews,
	MessariSearchResult,
} from "src/types/api-types";
import type { MessariModuleOptions } from "src/types/module-options.interface";

// Сервис для работы с Messari API
@Injectable()
export default class MessariService extends CoreService {
	constructor(
		@Inject(MESSARI_CLIENT_OPTIONS)
		protected readonly options: MessariModuleOptions,
		protected readonly logger: LoggerService
	) {
		const baseUrl = options.baseUrl || "https://data.messari.io/api/v1";
		const timeout = options.timeout || 30000;
		const apiKey = options.apiKey;

		super(baseUrl, timeout, apiKey, logger);

		this.logger.setContext(MessariService.name);
		this.logger.log("MessariService инициализирован");
	}

	// Получает список топ криптовалютных активов с ограничением по количеству
	async getTopAssets(limit = 100): Promise<MessariAsset[]> {
		const response = await this.makeRequest<{ data: MessariAsset[] }>("/assets", {
			limit,
		});

		return Array.isArray(response) ? response : response.data || [];
	}

	// Получает детальную информацию об активе включая метрики и профиль
	async getAsset(assetKey: string): Promise<MessariAssetDetails> {
		const response = await this.makeRequest<{ data: MessariAssetDetails }>(`/assets/${assetKey}`, {
			fields: "id,symbol,name,slug,metrics,profile",
		});

		return Array.isArray(response) ? response[0] : response.data || response;
	}

	// Получает новости связанные с конкретным активом
	async getAssetNews(assetKey: string, limit = 20): Promise<MessariNews[]> {
		const response = await this.makeRequest<{ data: MessariNews[] }>(`/news/${assetKey}`, {
			limit,
		});

		return Array.isArray(response) ? response : response.data || [];
	}

	// Получает общие новости криптовалютного рынка
	async getGeneralNews(limit = 20): Promise<MessariNews[]> {
		const response = await this.makeRequest<{ data: MessariNews[] }>("/news", {
			limit,
		});

		return Array.isArray(response) ? response : response.data || [];
	}

	// Выполняет поиск активов по запросу и возвращает список результатов
	async searchAssets(query: string): Promise<MessariSearchResult[]> {
		const response = await this.makeRequest<{ data: MessariSearchResult[] }>("/assets", {
			search: query,
		});

		return Array.isArray(response) ? response : response.data || [];
	}
}
