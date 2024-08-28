import { IKline, ISymbolsTicker } from '../types';
import { IProgressListener } from '../iProgressListener';
import { TimeFrameSeconds } from '../utils';

export enum Exchange {
    BINANCE = 'binance-spot',
    BINANCE_FUTURES = 'binance-futures',
    OKX = 'okx-spot',
    OKX_FUTURES = 'okx-futures'
}

export interface IExchangeSettings {
    makerCommission: number;
    maxNumKlinesInRequest: number;
    numKlinesParallelDownloads: number;
}


export abstract class BaseExchange {
    // to be implemented in a child class
    abstract getSymbolsTickers(): Promise<ISymbolsTicker>;
    protected abstract _getKlines(symbol: string, timeFrame: string, limit: number, from: number): Promise<IKline[]>;

    // base functions
    constructor(private _settings: IExchangeSettings) {
    }

    getDefaultCommission(): number {
        return this._settings.makerCommission;
    }

    private async _getKlinesInParallel(symbol: string, timeFrame: string, maxLimit: number, from: number, numParallelThreads:number): Promise<IKline[]> {
        const requests: Promise<IKline[]>[] = [];
      
        for (let i = 0; i < numParallelThreads; i += 1) {
            const currentFrom = from + i * maxLimit * TimeFrameSeconds[timeFrame];
            requests.push(this._getKlines(symbol, timeFrame, maxLimit, currentFrom));
        }
      
        const allResults = await Promise.all(requests);
      
        const uniqueKlines: IKline[] = [];
      
        for (const klines of allResults) {
            for (const kline of klines) {
                if (uniqueKlines.length === 0 || uniqueKlines[uniqueKlines.length - 1].openTime < kline.openTime) {
                    uniqueKlines.push(kline);
                }
            }
        }
        return uniqueKlines;
    }

    async downloadKlines(symbol: string, timeFrame: string, from: number, to?: number, progressListener?: IProgressListener): Promise<IKline[]> {
        to = to || Date.now()
        let data: IKline[] = []
        let currentDate = from;

        while (currentDate < Date.now() - TimeFrameSeconds[timeFrame]) {
            await progressListener?.onProgressUpdated(currentDate - from, to - from);
            let d: IKline[] = await this._getKlinesInParallel(symbol, timeFrame, this._settings.maxNumKlinesInRequest,
                                                              currentDate, this._settings.numKlinesParallelDownloads);

            if (d.length == 0) {
                break;
            }

            if (d[d.length - 1].openTime > to) {
                d = d.filter((e) => e.openTime <= to);
            }

            data = data.concat(d);

            const endTime = data[data.length - 1].openTime
            currentDate = endTime + 1;

            if (currentDate > to) {
                break;
            }
        }
        await progressListener?.onProgressUpdated(to - from, to - from);
        return data;
    }
}