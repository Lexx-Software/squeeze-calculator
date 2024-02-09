import { IKline } from "./types";
import { TimeFrameSeconds } from "./utils";

export class KlineBuilder {
    private _kline: IKline;
    private _timeFrameMs: number;
    private _sourceTimeFrameMs: number;

    constructor(tf: string, sourceTf: string, startKlines: IKline[] = []) {
        this._kline = undefined;
        this._timeFrameMs = TimeFrameSeconds[tf];
        this._sourceTimeFrameMs = TimeFrameSeconds[sourceTf];
        for (const k of startKlines) {
            this.applyNewKline(k)
        }
    }

    private _isLastKline(kline: IKline): boolean {
        return Math.floor((kline.openTime + this._sourceTimeFrameMs) / this._timeFrameMs) !== Math.floor(kline.openTime / this._timeFrameMs);
    }

    applyNewKline(kline: IKline): IKline {
        if (this._timeFrameMs === this._sourceTimeFrameMs) {
            return kline;
        }

        if (this._kline !== undefined && Math.floor(kline.openTime / this._timeFrameMs) !== Math.floor(this._kline.openTime / this._timeFrameMs)) {
            if (!this._isLastKline(kline)) {
                this._kline = { ...kline, closed: false };
            } else {
                this._kline = undefined;
            }
            // detected gap in klines => do not return kline
            return undefined;
        }

        if (!this._kline) {
            this._kline = { ...kline, closed: false };
        } else {
            this._kline.closeTime = kline.closeTime,
            this._kline.close = kline.close,
            this._kline.high = Math.max(kline.high, this._kline.high),
            this._kline.low = Math.min(kline.low, this._kline.low),
            this._kline.baseVolume += kline.baseVolume,
            this._kline.quoteVolume += kline.quoteVolume,
            this._kline.trades += kline.trades,
            this._kline.buyBaseVolume += kline.buyBaseVolume,
            this._kline.buyQuoteVolume += kline.buyQuoteVolume
        }

        if (this._isLastKline(kline)) {
            const k = this._kline;
            k.closed = true;
            this._kline = undefined;
            return k;
        }

        return this._kline;
    }
}