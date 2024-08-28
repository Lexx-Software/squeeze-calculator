const bent = require('bent')
const queryString = require('query-string');
import { IKeyValueObject, IKline, ISymbolsTicker } from '../types';
import { removeUndefined, sleep } from '../utils';
import { IBinanceExchangeInfo, BinanceTickerNames, ISymbolPriceFilter } from './binanceTypes';
import { BaseExchange, Exchange, IExchangeSettings } from './baseExchange';

interface IBinanceExchangeSettings extends IExchangeSettings {
    baseUrl: string;
    exchangeInfoPath: string;
    getKlinesPath: string;
}

const exchangeSettings: {[name: string]: IBinanceExchangeSettings} = {
    [Exchange.BINANCE]: {
        baseUrl: 'https://api.binance.com/',
        exchangeInfoPath: 'api/v3/exchangeInfo',
        getKlinesPath: 'api/v3/klines',
        maxNumKlinesInRequest: 1000,
        makerCommission: 0.075,
        numKlinesParallelDownloads: 5
    },
    [Exchange.BINANCE_FUTURES]: {
        baseUrl: 'https://fapi.binance.com/',
        exchangeInfoPath: 'fapi/v1/exchangeInfo',
        getKlinesPath: 'fapi/v1/klines',
        maxNumKlinesInRequest: 1000,
        makerCommission: 0.02,
        numKlinesParallelDownloads: 5
    }
}

export class BinanceExchange extends BaseExchange {
    private _getRequest: any;
    private _binanceSettings: IBinanceExchangeSettings;

    constructor(exchange: Exchange.BINANCE | Exchange.BINANCE_FUTURES) {
        super(exchangeSettings[exchange])
        this._binanceSettings = exchangeSettings[exchange];
        if (!this._binanceSettings) {
            throw new Error(`Unknown exchange ${exchange}`)
        }
        this._getRequest = bent(this._binanceSettings.baseUrl, 'GET', 'json');
    }

    async _doApiPublicRequest<T>(path: string, params?: IKeyValueObject): Promise<T> {
        if (params) {
            path += '?' + queryString.stringify(removeUndefined(params));
        }

        let tries = 10;

        while (tries--) {
            try {
                return await this._getRequest(path);
            }
            catch (e) {
                if (e.statusCode === 429 || e.statusCode === 418) {
                    await sleep(5 * 1000);
                    continue;
                }
                throw e;
            }
        }
        throw new Error('Max request tries reached');
    }


    private async _getSymbolsInfo(): Promise<IBinanceExchangeInfo> {
        return await this._doApiPublicRequest(this._binanceSettings.exchangeInfoPath)
    }

    async getSymbolsTickers(): Promise<ISymbolsTicker> {
        const symbolsInfo = await this._getSymbolsInfo();
        const result: ISymbolsTicker = {};
        for (const symbolInfo of symbolsInfo.symbols) {
            const priceFilter = symbolInfo.filters.find(f => f.filterType == 'PRICE_FILTER') as ISymbolPriceFilter;
            if (!priceFilter) {
                continue;
            }
            result[symbolInfo.symbol] = parseFloat(priceFilter.tickSize);
        }
        return result;
    }

    protected async _getKlines(symbol: string, timeFrame: string, limit: number, from: number): Promise<IKline[]> {
        const data = await this._doApiPublicRequest<any[]>(this._binanceSettings.getKlinesPath, {
            symbol: symbol,
            interval: timeFrame,
            startTime: from,
            limit: limit
        });

        return data.map(d => ({
            openTime: d[BinanceTickerNames.OPEN_TIME],
            closeTime: d[BinanceTickerNames.CLOSE_TIME],
            open: parseFloat(d[BinanceTickerNames.OPEN]),
            close: parseFloat(d[BinanceTickerNames.CLOSE]),
            high: parseFloat(d[BinanceTickerNames.HIGH]),
            low: parseFloat(d[BinanceTickerNames.LOW]),
            baseVolume: parseFloat(d[BinanceTickerNames.VOLUME]),
            quoteVolume: parseFloat(d[BinanceTickerNames.QUOTE_ASSET_VOLUME]),
            trades: d[BinanceTickerNames.NUMBER_OF_TRADES],
            buyBaseVolume: parseFloat(d[BinanceTickerNames.TAKER_BUY_BASE_ASSET_VOLUME]),
            buyQuoteVolume: parseFloat(d[BinanceTickerNames.TAKER_BUY_QUOTE_ASSET_VOLUME]),
            closed: true
        }));
    }
}