const bent = require('bent')
const queryString = require('query-string');
import { IKeyValueObject, IKline, ISymbolsTicker } from '../types';
import { TimeFrameSeconds, removeUndefined, sleep } from '../utils';
import { BaseExchange } from './baseExchange';
import { IOkxSymbolInfo, OkxInstType, OkxTickerNames, TIME_FRAME_TO_OKX_TIME_FRAME_MAP } from './okxTypes';

function getOkxDefaultCommission(instType: OkxInstType): number {
    switch (instType) {
        case OkxInstType.SPOT: return 0.08;
        case OkxInstType.SWAP: return 0.02;
        default:
            throw new Error('need implementation')
    }
}

const MAX_KLINES_REQUEST_LENGTH = 100;

export class OkxExchange extends BaseExchange {
    private _getRequest: any;

    constructor(private _instType: OkxInstType) {
        super({
            makerCommission: getOkxDefaultCommission(_instType),
            maxNumKlinesInRequest: MAX_KLINES_REQUEST_LENGTH,
            numKlinesParallelDownloads: 3
        })
        this._getRequest = bent('https://aws.okx.com', 'GET', 'json');
    }

    async _doOkxApiPublicRequest<T>(path: string, params?: IKeyValueObject): Promise<T> {
        if (params) {
            path += '?' + queryString.stringify(removeUndefined(params));
        }

        let tries = 5;

        while (tries--) {
            try {
                const result = await this._getRequest(path);
                return result.data;
            }
            catch (e) {
                if (e.statusCode === 429) {
                    await sleep(500);
                    continue;
                }
                throw e;
            }
        }
        throw new Error('Max request tries reached');
    }

    // returns history klines, last ones could be missed
    private async _getOkxKlinesHistory(instId: string, timeFrame: string, limit: number, from?: number): Promise<IKline[]> {
        const params: IKeyValueObject = {
            instId: instId,
            bar: TIME_FRAME_TO_OKX_TIME_FRAME_MAP[timeFrame],
            limit: limit
        }

        if (from) {
            params.before = from - 1;

            const requestLimit = limit === undefined ? MAX_KLINES_REQUEST_LENGTH : limit;
            params.after = params.before + Math.round((requestLimit + 0.5) * TimeFrameSeconds[timeFrame])
        }

        const data = await this._doOkxApiPublicRequest<string[][]>('/api/v5/market/history-candles', params);

        return this._convertKlines(data, timeFrame);
    }

    // returns 1440 last entries
    private async _getOkxKlines(instId: string, timeFrame: string, limit: number, from?: number): Promise<IKline[]> {
        const params: IKeyValueObject = {
            instId: instId,
            bar: TIME_FRAME_TO_OKX_TIME_FRAME_MAP[timeFrame],
            limit: limit
        }

        if (from) {
            params.before = from - 1;

            const requestLimit = limit === undefined ? MAX_KLINES_REQUEST_LENGTH : limit;
            params.after = params.before + Math.round((requestLimit + 0.5) * TimeFrameSeconds[timeFrame])
        }

        const data = await this._doOkxApiPublicRequest<string[][]>('/api/v5/market/candles', params);

        return this._convertKlines(data, timeFrame);
    }

    private _instIdToSymbol(instId: string): string {
        if (this._instType === OkxInstType.SWAP) {
            return instId.substring(0, instId.length - OkxInstType.SWAP.length - 1)
        }
        return instId;
    }
    
    private _symbolToInstId(symbol: string): string {
        if (this._instType === OkxInstType.SWAP) {
            return symbol + '-' + OkxInstType.SWAP
        }
        return symbol;
    }
    
    protected async _getKlines(symbol: string, timeFrame: string, limit: number, from: number): Promise<IKline[]> {
        const instId = this._symbolToInstId(symbol);

        if (from && (Date.now() - from > 1400 * TimeFrameSeconds[timeFrame])) {
            return await this._getOkxKlinesHistory(instId, timeFrame, limit, from);
        }
        return await this._getOkxKlines(instId, timeFrame, limit, from);
    }

    private async _getSymbolsInfo(): Promise<IOkxSymbolInfo[]> {
        return await this._doOkxApiPublicRequest<IOkxSymbolInfo[]>('/api/v5/public/instruments', {
            instType: this._instType
        });
    }

    async getSymbolsTickers(): Promise<ISymbolsTicker> {
        const symbolsInfo = await this._getSymbolsInfo();

        const result: ISymbolsTicker = {};
        for (const symbolInfo of symbolsInfo) {
            const symbol = this._instIdToSymbol(symbolInfo.instId)
            result[symbol] = parseFloat(symbolInfo.tickSz);
        }
        return result;
    }

    private _convertKlines(data: string[][], timeFrame: string): IKline[] {
        const tfMs = TimeFrameSeconds[timeFrame];
        const result:IKline[] = [];
        for (let idx = data.length - 1; idx >= 0; idx--) {
            const d = data[idx];
            const openTime = parseInt(d[OkxTickerNames.OPEN_TIME]);
            result.push({
                openTime: openTime,
                closeTime: openTime + tfMs - 1,
                open: parseFloat(d[OkxTickerNames.OPEN]),
                close: parseFloat(d[OkxTickerNames.CLOSE]),
                high: parseFloat(d[OkxTickerNames.HIGH]),
                low: parseFloat(d[OkxTickerNames.LOW]),
                baseVolume: parseFloat(d[OkxTickerNames.VOLUME]),
                quoteVolume: parseFloat(d[OkxTickerNames.QUOTE_ASSET_VOLUME]),
                closed: d[OkxTickerNames.CONFIRM] == '1'
            })
        }
        return result;
    }
}