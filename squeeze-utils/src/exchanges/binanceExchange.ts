const bent = require('bent')
const queryString = require('query-string');
import { IKeyValueObject, IKline } from '../types';
import { TimeFrameSeconds, removeUndefined } from '../utils';
import { IBinanceExchangeInfo, BinanceTickerNames, ISymbolPriceFilter } from './binanceTypes';
import { IProgressListener } from '../iProgressListener';


export interface ISymbolsTicker {
    [symbol: string]: number
}

interface IBinanceExchangeSettings {
    baseUrl: string;
    exchangeInfoPath: string;
    getKlinesPath: string;
    maxKlinesRequestLength: number;
}

const exchangeSettings: {[name: string]: IBinanceExchangeSettings} = {
    binance: {
        baseUrl: 'https://api.binance.com/',
        exchangeInfoPath: 'api/v3/exchangeInfo',
        getKlinesPath: 'api/v3/klines',
        maxKlinesRequestLength: 1000
    },
    'binance-futures': {
        baseUrl: 'https://fapi.binance.com/',
        exchangeInfoPath: 'fapi/v1/exchangeInfo',
        getKlinesPath: 'fapi/v1/klines',
        maxKlinesRequestLength: 1500
    }
}

const MAX_KLINES_REQUEST_LENGTH = 1000;

export class BinanceExchange {
    private _getRequest: any;
    private _settings: IBinanceExchangeSettings;

    constructor(exchange: 'binance' | 'binance-futures') {
        this._settings = exchangeSettings[exchange];
        if (!this._settings) {
            throw new Error(`Unknown exchange ${exchange}`)
        }
        this._getRequest = bent(this._settings.baseUrl, 'GET', 'json');
    }

    async _doApiPublicRequest(path: string, params?: IKeyValueObject): Promise<any> {
        if (params) {
            path += '?' + queryString.stringify(removeUndefined(params));
        }
        return await this._getRequest(path);
    }

    async getSymbolsInfo(): Promise<IBinanceExchangeInfo> {
        return await this._doApiPublicRequest(this._settings.exchangeInfoPath)
    }

    async getSymbolsTickers(): Promise<ISymbolsTicker> {
        const symbolsInfo = await this.getSymbolsInfo();
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

    async downloadKlines(symbol: string, timeFrame: string, from: number, to?: number, progressListener?: IProgressListener): Promise<IKline[]> {
        to = to || Date.now()
        let data = []
        let currentDate = from;

        while (currentDate < Date.now() - TimeFrameSeconds[timeFrame]) {
            await progressListener?.onProgressUpdated(currentDate - from, to - from);
            let d: IKline[] = await this._doApiPublicRequest(this._settings.getKlinesPath, {
                symbol: symbol,
                interval: timeFrame,
                startTime: currentDate,
                limit: this._settings.maxKlinesRequestLength
            });

            if (d.length == 0) {
                break;
            }

            if (d[d.length - 1].openTime > to) {
                d = d.filter((e) => e.openTime <= to);
            }

            data = data.concat(d);

            let endTime = data[data.length - 1][BinanceTickerNames.OPEN_TIME]
            currentDate = endTime + 1;

            if (currentDate > to) {
                break;
            }
        }
        await progressListener?.onProgressUpdated(to - from, to - from);

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