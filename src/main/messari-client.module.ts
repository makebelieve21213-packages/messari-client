import { LoggerService } from "@makebelieve21213-packages/logger";
import { Module, Global, DynamicModule, Provider } from "@nestjs/common";
import MessariService from "src/main/messari-client.service";
import {
	MessariModuleOptions,
	MessariModuleAsyncOptions,
} from "src/types/module-options.interface";
import { MESSARI_CLIENT_OPTIONS } from "src/utils/injection-keys";

// Глобальный модуль для Messari API клиента
@Global()
@Module({})
export default class MessariModule {
	// Регистрация модуля с динамическими опциями через useFactory
	static forRootAsync<T extends unknown[]>(options: MessariModuleAsyncOptions<T>): DynamicModule {
		const providers: Provider[] = [
			{
				provide: MESSARI_CLIENT_OPTIONS,
				useFactory: options.useFactory,
				inject: options.inject || [],
			},
			{
				provide: MessariService,
				useFactory: (moduleOptions: MessariModuleOptions, logger: LoggerService): MessariService => {
					return new MessariService(moduleOptions, logger);
				},
				inject: [MESSARI_CLIENT_OPTIONS, LoggerService],
			},
		];

		return {
			module: MessariModule,
			imports: options.imports || [],
			providers,
			exports: [MessariService],
		};
	}
}
