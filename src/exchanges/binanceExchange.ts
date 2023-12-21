import * as request from 'request';
const queryString = require('query-string');
import { IKeyValueObject, IKline } from '../types';
import { TimeFrameSeconds, removeUndefined } from '../utils';
import { IBinanceExchangeInfo, BinanceTickerNames, ISymbolPriceFilter } from './binanceTypes';
import { IProgressListener } from '../iProgressListener';


export interface ISymbolsTicker {
    [symbol: string]: number
}

const MAX_KLINES_REQUEST_LENGTH = 1000;

export class BinanceExchange {
    private _baseUrls: string;

    constructor(exchange: 'binance' | 'binance-futures') {
        if (exchange == 'binance') {
            this._baseUrls = 'https://api.binance.com/'
        } else if (exchange == 'binance-futures') {
            this._baseUrls = 'https://fapi.binance.com/'
        } else {
            throw new Error(`Unknown exchange ${exchange}`)
        }
    }

    private async _doSingleHttpRequest<T = any | undefined>(requestOptions: request.OptionsWithUrl): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            request(requestOptions, (error, response, data) => {
                if (error) {
                    console.warn('Call failed: %s (%s)', error.toString(), JSON.stringify(requestOptions));
                    reject(error);
                    return;
                }
    
                if (!response) {
                    resolve(response);
                    return;
                }

                if (!data) {
                    console.log('Empty data: %s', JSON.stringify(response.toJSON()));
                }
    
                resolve(data);
            });
        });
    }
    
    async _doApiPublicRequest(path: string, params?: IKeyValueObject): Promise<any> {
        const requestOptions: request.OptionsWithUrl = {
            url: this._baseUrls + path,
            method: 'GET'
        };
    
        if (params) {
            requestOptions.url += '?' + queryString.stringify(removeUndefined(params));
        }

        const result = await this._doSingleHttpRequest(requestOptions);

        const d = JSON.parse(result);
        if (d.code || d.msg) {
            throw new Error(`Data: ${result.data} call: ${JSON.stringify(requestOptions)}`);
        }
        return d;
    }

    async getSymbolsInfo(): Promise<IBinanceExchangeInfo> {
        return await this._doApiPublicRequest('api/v3/exchangeInfo');
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
            progressListener?.onProgressUpdated(currentDate - from, to - from);
            const d = await this._doApiPublicRequest('api/v3/klines', {
                symbol: symbol,
                interval: timeFrame,
                startTime: currentDate,
                limit: MAX_KLINES_REQUEST_LENGTH
            });
            data = data.concat(d);

            if (data.length == 0) {
                break;
            }

            let endTime = data[data.length - 1][BinanceTickerNames.OPEN_TIME]
            if (currentDate > to) {
                break;
            }
            currentDate = endTime + 1;
        }
        progressListener?.onProgressUpdated(to - from, to - from);

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
            buyQuoteVolume: parseFloat(d[BinanceTickerNames.TAKER_BUY_QUOTE_ASSET_VOLUME])
        }));
    }
}