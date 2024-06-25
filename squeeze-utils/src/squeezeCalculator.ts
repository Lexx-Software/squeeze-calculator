import { IProgressListener } from "./iProgressListener";
import { KlineBuilder } from "./klineBuilder";
import { IKline, IRange } from "./types";
import { TimeFrameSeconds, deepCopy, floorFloat } from "./utils";


export enum SqueezeBindings {
    LOW = 'low',
    HIGH = 'high',
    OPEN = 'open',
    CLOSE = 'close',
    MID_HL = 'mid_hl',
    MID_OC = 'mid_oc'
}

export interface ISqueezeDeal {
    timeEnter: number;
    timeExit: number;
    priceEnter: number;
    priceExit: number;
    profitPercent: number;
    drawdownPercent: number;
    isTimeStopLoss?: boolean;
    isPercentStopLoss?: boolean;
}

export interface ISqueezeDealsStatistic {
    settings: ISqueezeParameters;
    totalProfitPercent: number;
    totalCumulativePercent: number;
    totalDeals: number;
    numStopLossDeals: number;
    numProfitDeals: number;
    coeff: number;
    winRate: number;
    maxDrawdownPercent: number;
    maxTimeInDeal: number;
    deals: ISqueezeDeal[];
}

export interface ISqueezeParameters {
    isShort: boolean;
    percentEnter: number;
    percentExit: number | IRange;
    binding: SqueezeBindings;
    timeFrame: string;
    oncePerCandle: boolean;
    stopLossTime?: number;
    stopLossPercent?: number;
    stopOnKlineClosed?: boolean;
}

interface IDirectionSettings {
    multiplier: 1 | -1,
    minKeyName: 'low' | 'high',
    maxKeyName: 'low' | 'high'
}


interface ISqueezeCalculationContext {
    percentExit: number;
    exitPriceFactor: number;
    deals: ISqueezeDeal[];
    lockedTill: number;
    currentSellPrice?: number;
}

interface IDealContext {
    timeEnter: number;
    priceEnter: number;
    minPrice: number;
}

export class SqueezeCalculator {
    private _enterPriceFactor: number;
    private _stopLossPriceFactor: number;
    private _priceTickExpLevel: number;
    private _oncePerCandleCurrentTime: number = 0;
    private _direction: IDirectionSettings;
    private _resultsContext: ISqueezeCalculationContext[] = [];

    constructor(private _params: ISqueezeParameters, priceTick: number, private _commissionPercent: number) {
        if (_params.isShort) {
            this._direction = {
                multiplier: -1,
                minKeyName: 'high',
                maxKeyName: 'low'
            }
        } else {
            this._direction = {
                multiplier: 1,
                minKeyName: 'low',
                maxKeyName: 'high'
            }
        }
        
        // optimization precalculations
        this._enterPriceFactor = (100 - this._direction.multiplier * _params.percentEnter) / 100;
        if (_params.stopLossPercent) {
            this._stopLossPriceFactor = (100 - this._direction.multiplier * _params.stopLossPercent) / 100;
        }
        this._priceTickExpLevel = 0;
        while (priceTick < 1) {
            priceTick *= 10;
            this._priceTickExpLevel++;
        }

        this._resultsContext = []
        if (typeof _params.percentExit === 'number') {
            this._addPercentExitForCalculations(_params.percentExit);
        } else {
            let percentExit = _params.percentExit.from;
            while (percentExit <= _params.percentExit.to + 0.000000001) {
                this._addPercentExitForCalculations(percentExit);
                percentExit += 0.1;
            }
        }
    }

    private _addPercentExitForCalculations(percentExit: number): void {
        percentExit = floorFloat(percentExit + Number.EPSILON, 1)
        this._resultsContext.push({
            percentExit: percentExit,
            exitPriceFactor: (100 + this._direction.multiplier * percentExit) / 100,
            deals: [],
            lockedTill: 0
        });
    }

    private _getKlineBindingPrice(binding: SqueezeBindings, kline: IKline): number {
        if (binding === 'mid_hl') {
            return (kline.high + kline.low) / 2;
        } else if (binding === 'mid_oc') {
            return (kline.open + kline.close) / 2;
        }
        return kline[binding];
    }

    private _calculateEnterPriceForKline(kline: IKline): number {
        const bindingPrice = this._getKlineBindingPrice(this._params.binding, kline);
        const buyPrice = bindingPrice * this._enterPriceFactor;
        return floorFloat(buyPrice, this._priceTickExpLevel);
    }

    private _calculateExitPrice(buyPrice: number, exitPriceFactor: number): number {
        return floorFloat(buyPrice * exitPriceFactor, this._priceTickExpLevel);
    }

    private _calculateStopLossPrice(buyPrice: number): number|undefined {
        if (!this._stopLossPriceFactor) {
            return undefined;
        }
        const stopLossPrice = buyPrice * this._stopLossPriceFactor;
        return floorFloat(stopLossPrice, this._priceTickExpLevel);
    }

    private _buildDeal(dealContext: IDealContext, priceExit: number, timeExit: number, stopLossType?: 'price' | 'time'): ISqueezeDeal {
        const deal: ISqueezeDeal = {
            timeEnter: dealContext.timeEnter,
            timeExit: timeExit,
            priceEnter: this._direction.multiplier * dealContext.priceEnter,
            priceExit: this._direction.multiplier * priceExit,
            profitPercent: undefined,
            drawdownPercent: this._direction.multiplier * (dealContext.priceEnter - dealContext.minPrice) / dealContext.priceEnter * 100
        }

        if (stopLossType === 'price') {
            deal.isPercentStopLoss = true;
        } else if (stopLossType === 'time') {
            deal.isTimeStopLoss = true;
        }

        if (this._params.isShort) {
            deal.profitPercent = 100 / deal.priceExit * deal.priceEnter - 100 - (100 + 100 / deal.priceExit * deal.priceEnter) * this._commissionPercent / 100;
        } else {
            deal.profitPercent = 100 / deal.priceEnter * deal.priceExit - 100 - (100 + 100 / deal.priceEnter * deal.priceExit) * this._commissionPercent / 100;
        }

        return deal;
    }

    private _calculateLockTime(timeExit: number) {
        if (!this._params.oncePerCandle) {
            return timeExit;
        }

        return Math.max(this._oncePerCandleCurrentTime, timeExit);
    }

    private _checkSellHappensInKline(kline: IKline, dealContext: IDealContext, contextIdx: number, stopLossPrice: number|undefined, sellBinding: string): number {
        if (kline[this._direction.minKeyName] < dealContext.minPrice) {
            dealContext.minPrice = kline[this._direction.minKeyName];
        }

        // be pessimistic, first check stop-losses and then sells
        if (stopLossPrice && kline[this._params.stopOnKlineClosed ? 'close' : this._direction.minKeyName] <= stopLossPrice) {
            // stop by price
            const deal = this._buildDeal(dealContext, this._params.stopOnKlineClosed ? kline.close : stopLossPrice, kline.closeTime, 'price');
            if (!this._params.stopOnKlineClosed) {
                // update drawdownPercent because stoploss happens on the minimal price
                deal.drawdownPercent = this._params.stopLossPercent;
            }
            while (contextIdx < this._resultsContext.length && this._resultsContext[contextIdx].currentSellPrice) {
                this._resultsContext[contextIdx].lockedTill = this._calculateLockTime(deal.timeExit);
                this._resultsContext[contextIdx].deals.push(deal)
                contextIdx++
            }
            return contextIdx;
        }

        if (this._params.stopLossTime && kline.closeTime - dealContext.timeEnter > this._params.stopLossTime) {
            // stop by time
            const deal = this._buildDeal(dealContext, kline[this._direction.minKeyName], kline.closeTime, 'time');
            while (contextIdx < this._resultsContext.length && this._resultsContext[contextIdx].currentSellPrice) {
                this._resultsContext[contextIdx].lockedTill = this._calculateLockTime(deal.timeExit);
                this._resultsContext[contextIdx].deals.push(deal)
                contextIdx++
            }
            return contextIdx;
        }

        while (contextIdx < this._resultsContext.length && this._resultsContext[contextIdx].currentSellPrice && this._resultsContext[contextIdx].currentSellPrice < kline[sellBinding]) {
            const deal = this._buildDeal(dealContext, this._resultsContext[contextIdx].currentSellPrice, kline.closeTime);
            this._resultsContext[contextIdx].lockedTill = this._calculateLockTime(deal.timeExit);
            this._resultsContext[contextIdx].deals.push(deal)
            contextIdx++
        }
        return contextIdx;
    }

    private _calculateDeals(klines: IKline[], i: number, buyPrice: number): void {
        const dealContext: IDealContext = {
            timeEnter: klines[i].openTime,
            priceEnter: buyPrice,
            minPrice: buyPrice,
        }

        for (const result of this._resultsContext) {
            if (result.lockedTill < klines[i].openTime) {
                result.currentSellPrice = this._calculateExitPrice(buyPrice, result.exitPriceFactor);
            } else {
                // the previous deal was not closed, do not start a new one
                result.currentSellPrice = undefined;
            }
        }

        const stopLossPrice = this._calculateStopLossPrice(buyPrice);

        let contextIdx = 0;
        contextIdx = this._checkSellHappensInKline(klines[i], dealContext, contextIdx, stopLossPrice, 'close')
        i++

        while (contextIdx < this._resultsContext.length && this._resultsContext[contextIdx].currentSellPrice && i < klines.length) {
            contextIdx = this._checkSellHappensInKline(klines[i], dealContext, contextIdx, stopLossPrice, this._direction.maxKeyName)
            i++;
        }

        // if positions are not closed, close them by the last kline price
        if (contextIdx < this._resultsContext.length && this._resultsContext[contextIdx].currentSellPrice) {
            const deal = this._buildDeal(dealContext, klines[klines.length - 1].close, klines[klines.length - 1].closeTime, 'time');
            while (contextIdx < this._resultsContext.length && this._resultsContext[contextIdx].currentSellPrice) {
                this._resultsContext[contextIdx].lockedTill = deal.timeExit;
                this._resultsContext[contextIdx].deals.push(deal)
                contextIdx++
            }
        }
    }

    calculate(klines: IKline[], klinesTf: string, progressBar?: IProgressListener): ISqueezeDealsStatistic[] {
        if (klines.length > 0 && klines[0].open * this._direction.multiplier < 0) {
            throw new Error(`The klines are not prepared for current direction. Please call invertKlines function before calculation`);
        }

        const klineBuilder = new KlineBuilder(this._params.timeFrame, klinesTf);

        let nextBuyPrice: number = undefined;
        for (let i = 0; i < klines.length; i++) {
            progressBar?.onProgressUpdated(i, klines.length - 1)
            const kline = klines[i];
            const squeezeTfKline = klineBuilder.applyNewKline(klines[i]);
            const currentBuyPrice = nextBuyPrice;
            if (squeezeTfKline?.closed) {
                nextBuyPrice = this._calculateEnterPriceForKline(squeezeTfKline);
                this._oncePerCandleCurrentTime = undefined;
            }

            if (!currentBuyPrice) {
                continue;
            }

            // there is a deal in progress
            if (this._resultsContext[0].lockedTill >= kline.openTime) {
                continue;
            }

            // check buy and sell
            if (kline[this._direction.minKeyName] < currentBuyPrice) {

                // oncePerCandle logic
                if (this._params.oncePerCandle && !this._oncePerCandleCurrentTime) {
                    const ftMs = TimeFrameSeconds[this._params.timeFrame];
                    // calculate the end of next kline
                    this._oncePerCandleCurrentTime = Math.floor(kline.openTime / ftMs) * ftMs + ftMs - 1;
                }

                this._calculateDeals(klines, i, currentBuyPrice);
            }
        }

        return this._calculateResultsDealsStatistic();
    }

    private _calculateResultsDealsStatistic(): ISqueezeDealsStatistic[] {
        const result: ISqueezeDealsStatistic[] = [];
        for (const resultContext of this._resultsContext) {
            const settings = deepCopy(this._params);
            settings.percentExit = resultContext.percentExit;
            result.push(this.calculateDealsStatistic(resultContext.deals, settings));
        }

        return result;
    }

    calculateDealsStatistic(deals: ISqueezeDeal[], settings: ISqueezeParameters): ISqueezeDealsStatistic {
        const result: ISqueezeDealsStatistic = {
            settings: settings,
            totalProfitPercent: 0,
            totalCumulativePercent: 100,
            totalDeals: deals.length,
            numStopLossDeals: 0,
            numProfitDeals: 0,
            coeff: undefined,
            winRate: 100,
            maxDrawdownPercent: 0,
            maxTimeInDeal: 0,
            deals: deals
        }

        let sumStops = 0;
        let sumTakes = 0;

        for (const d of deals) {
            result.totalCumulativePercent *= (1 + d.profitPercent / 100);
            result.totalProfitPercent += d.profitPercent;

            if (d.profitPercent >= 0) {
                result.numProfitDeals += 1;
                sumTakes += d.profitPercent;
            } else {
                sumStops += d.profitPercent;
            }

            if (d.isTimeStopLoss || d.isPercentStopLoss) {
                result.numStopLossDeals += 1;
            }

            if (d.drawdownPercent > result.maxDrawdownPercent) {
                result.maxDrawdownPercent = d.drawdownPercent;
            }
            const timeInDeal = d.timeExit - d.timeEnter;
            if (timeInDeal > result.maxTimeInDeal) {
                result.maxTimeInDeal = timeInDeal;
            }
        }
        if (sumStops != 0) {
            result.coeff = -sumTakes/sumStops
        }
        if (deals.length > 0) {
            result.winRate = (deals.length - result.numStopLossDeals) / deals.length;
        }
        result.totalCumulativePercent -= 100;
        return result;
    }
}