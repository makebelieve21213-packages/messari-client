// Типы для Messari API запросов и ответов

export interface MessariAsset {
	id: string;
	symbol: string;
	name: string;
	slug: string;
	metrics?: {
		marketData?: {
			priceUsd?: number;
			priceBtc?: number;
			priceEth?: number;
			volumeLast24Hours?: number;
			realVolumeLast24Hours?: number;
			volumeLast24HoursOverstatementMultiple?: number;
			percentChangeLast1Hour?: number;
			percentChangeLast24Hours?: number;
			ohlcvLast1Hour?: {
				open?: number;
				high?: number;
				low?: number;
				close?: number;
				volume?: number;
			};
			ohlcvLast24Hour?: {
				open?: number;
				high?: number;
				low?: number;
				close?: number;
				volume?: number;
			};
		};
		marketcap?: {
			rank?: number;
			currentMarketcapUsd?: number;
			y2050MarketcapUsd?: number;
			yPlus10MarketcapUsd?: number;
			liquidMarketcapUsd?: number;
			volumeTurnoverLast24HoursPercent?: number;
		};
		supply?: {
			y2050?: number;
			yPlus10?: number;
			liquid?: number;
			stockToFlow?: number;
			yPlus10EmissionedPercent?: number;
			annualInflationPercent?: number;
			stockToFlowDeflectionRatio?: number;
			annualInflationPercentY2050?: number;
			annualInflationPercentYPlus10?: number;
		};
		blockchainStats24Hours?: {
			countOfActiveAddresses?: number;
			countOfTransactions?: number;
			countOfLargeTransactions?: number;
			countOfPayments?: number;
			medianTransactionValue?: number;
			medianFee?: number;
			adjustedNvt?: number;
			adjustedRvt?: number;
			medianTransferValue?: number;
			exchangeVolume?: number;
			medianExchangeRate?: number;
			exchangeVolumeAdjusted?: number;
			exchangeUniqueAddresses?: number;
			medianExchangeRateAdjusted?: number;
		};
		allTimeHigh?: {
			price?: number;
			at?: string;
			daysSince?: number;
			percentDown?: number;
		};
		cycleLow?: {
			price?: number;
			at?: string;
			percentUp?: number;
		};
	};
	profile?: {
		general?: {
			overview?: {
				tagline?: string;
				projectDetails?: string;
				officialLinks?: Array<{
					name?: string;
					link?: string;
				}>;
			};
			background?: {
				backgroundDetails?: string;
				issuingOrganizations?: unknown[];
			};
		};
	};
}

export interface MessariAssetDetails extends MessariAsset {
	profile?: {
		general?: {
			overview?: {
				tagline?: string;
				projectDetails?: string;
				officialLinks?: Array<{
					name?: string;
					link?: string;
				}>;
			};
			background?: {
				backgroundDetails?: string;
				issuingOrganizations?: unknown[];
			};
		};
		economics?: {
			token?: {
				tokenName?: string;
				tokenType?: string;
			};
			launch?: {
				general?: {
					launchStyle?: string;
					launchDetails?: string;
				};
				fundraising?: {
					salesStart?: string;
					salesEnd?: string;
					salesAmount?: number;
					pricePerTokenInUsd?: number;
				};
			};
			consensusAndEmission?: {
				consensusMechanism?: string;
				consensusDetails?: string;
			};
			nativeToken?: {
				tokenName?: string;
				tokenType?: string;
			};
		};
		technology?: {
			overview?: {
				technologyDetails?: string;
				issue?: string;
			};
			security?: {
				audits?: Array<{
					title?: string;
					date?: string;
					type?: string;
					details?: string;
				}>;
			};
		};
	};
}

export interface MessariNews {
	id: string;
	title: string;
	content?: string;
	subtitle?: string;
	publishedAt: string;
	updatedAt?: string;
	author?: {
		name?: string;
		slug?: string;
	};
	tags?: string[];
	cover?: {
		url?: string;
		thumbnailUrl?: string;
	};
	coverImageUrl?: string;
	coverThumbnailUrl?: string;
	relatedAssets?: Array<{
		id?: string;
		name?: string;
		slug?: string;
	}>;
	relatedCoins?: string[];
	url?: string;
	source?: {
		name?: string;
		slug?: string;
	};
}

export interface MessariSearchResult {
	id: string;
	name: string;
	symbol: string;
	slug: string;
}
