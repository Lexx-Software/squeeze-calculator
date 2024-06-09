import {
    DatafeedConfiguration,
    ErrorCallback,
    HistoryCallback,
    LibrarySymbolInfo,
    OnReadyCallback,
    PeriodParams,
    ResolutionString,
    ResolveCallback,
    SearchSymbolsCallback,
    SubscribeBarsCallback,
    Bar
} from '../../../assets/charting_library';
import { ICalculatedResult } from '../../calculate';
import { KlineBuilder } from 'squeeze-utils';


export const TVResolutionToTimeFrame = {
    '1': '1m',
    '3': '3m',
    '5': '5m',
    '15': '15m',
    '30': '30m',
    '60': '1h',
    '120': '2h',
    '240': '4h',
    '360': '6h',
    '480': '8h',
    '720': '12h',
    '1D': '1d'
}

export const TimeFrameToTVResolution = {
    '1m': '1',
    '3m': '3',
    '5m': '5',
    '15m': '15',
    '30m': '30',
    '1h': '60',
    '2h': '120',
    '4h': '240',
    '6h': '360',
    '8h': '480',
    '12h': '720',
    '1d': '1D'
}

const SEC_MS = 1000;

export class TradingViewDataFeed {
    public lastLoadedDataHistoryTime: number;

    constructor(private _result: ICalculatedResult) {
    }

    private _getSuppliedResolutions(): ResolutionString[] {
        const result = []
        let found = false;
        for (const [timeFrame, resolution] of Object.entries(TimeFrameToTVResolution)) {
            found = found || timeFrame == this._result.klinesTimeFrame;
            if (found) {
                result.push(resolution as ResolutionString);
            }
        }
        return result;
    }

    onReady(callback: OnReadyCallback): void {
        const configurationData: DatafeedConfiguration = {
            supported_resolutions: this._getSuppliedResolutions(),
            supports_time: true
        };

        const timeout = setTimeout(() => {
            clearTimeout(timeout);
            callback(configurationData);
        });
    }

    searchSymbols(
        userInput: string,
        exchange: string,
        symbolType: string,
        onResultReadyCallback: SearchSymbolsCallback
    ) {
        setTimeout(() => onResultReadyCallback([{
			symbol: `${this._result.exchange}:${this._result.symbol}`,
			full_name: `${this._result.exchange}:${this._result.symbol}`,
			description: 'symbol',
			exchange: this._result.exchange,
			type: 'crypto',
		}]), 0);
    }

    resolveSymbol(
        ticker: string,
        onSymbolResolvedCallback: ResolveCallback,
        onResolveErrorCallback: ErrorCallback
    ) {
        setTimeout(() => onSymbolResolvedCallback({
            'ticker': ticker,
            'name': `${this._result.exchange}:${this._result.symbol}`,
            'full_name': `${this._result.exchange}:${this._result.symbol}`,
            'description':`${this._result.exchange}:${this._result.symbol}`,
            'listed_exchange': this._result.exchange,
            'format': 'price',
            'type': 'crypto',
            'session': '24x7',
            'timezone': 'Etc/UTC',
            'exchange': this._result.exchange,
            'minmov': 1,
            'pricescale': Math.round(1 / this._result.ticker),
            'has_intraday': true,
            'visible_plots_set': 'ohlcv',
            'has_weekly_and_monthly': false,
            'supported_resolutions': this._getSuppliedResolutions(),
            'volume_precision': 1,
            'data_status': 'streaming',
            'expired': true,
            'expiration_date': (this._result.klines[this._result.klines.length - 1].openTime) / SEC_MS
        }), 0);
    }

    getBars(
        symbolInfo: LibrarySymbolInfo,
        resolution: ResolutionString,
        periodParams: PeriodParams,
        onHistoryCallback: HistoryCallback,
        onErrorCallback: ErrorCallback
    ) {
        const from = periodParams.from * SEC_MS;
        const to = periodParams.to * SEC_MS;

        const klines =  this._result.klines;
        let startIndex = 0;
        while (startIndex < klines.length && from > klines[startIndex].openTime) {
            startIndex++
        }

        if (startIndex == klines.length) {
            onHistoryCallback([], {
                noData: true
            });
            return;
        }

        let endIndex = startIndex;
        const result: Bar[] = [];
        const klinesBuilder = new KlineBuilder(TVResolutionToTimeFrame[resolution], this._result.klinesTimeFrame);
        while (endIndex < klines.length && to > klines[endIndex].openTime) {
            const k = klinesBuilder.applyNewKline(klines[endIndex]);
            if (k.closed || endIndex == klines.length-1) {
                result.push({
                    time: k.openTime,
                    open: k.open,
                    high: k.high,
                    low: k.low,
                    close: k.close,
                    volume: k.baseVolume
                });
            }
            endIndex++
        }

        if (result.length > 0) {
            this.lastLoadedDataHistoryTime = result[0].time;
        }

        onHistoryCallback(result, {
            noData: endIndex == 0
        });
    }

    subscribeBars (
        symbolInfo: LibrarySymbolInfo,
        resolution: ResolutionString,
        onTick: SubscribeBarsCallback,
        listenerGuid: string,
        onResetCacheNeededCallback: () => void
    ): void {}
    
    unsubscribeBars(listenerGuid: string) {}
}