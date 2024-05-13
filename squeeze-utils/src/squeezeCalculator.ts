import { IProgressListener } from "./iProgressListener";
import { KlineBuilder } from "./klineBuilder";
import { IKline } from "./types";
import { floorFloat } from "./utils";


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
    minPrice?: number;
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
    percentExit: number;
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

export class SqueezeCalculator {
    private _enterPriceFactor: number;
    private _exitPriceFactor: number;
    private _stopLossPriceFactor: number;
    private _priceTickExpLevel: number;
    private _direction: IDirectionSettings;

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
        this._exitPriceFactor = (100 + this._direction.multiplier * _params.percentExit) / 100;
        if (_params.stopLossPercent) {
            this._stopLossPriceFactor = (100 - this._direction.multiplier * _params.stopLossPercent) / 100;
        }
        this._priceTickExpLevel = 0;
        while (priceTick < 1) {
            priceTick *= 10;
            this._priceTickExpLevel++;
        }
    }

    private _getKlineBindingPrice(binding: SqueezeBindings, kline: IKline): number {
        if (binding === 'mid_hl') {
            return (kline.high + kline.low) / 2;
        } else if (binding === 'mid_oc') {
            return (kline.open + kline.close) / 2;
        }
        return kline[binding];
    }

    private _calculateBuyPriceForKline(kline: IKline): number {
        const bindingPrice = this._getKlineBindingPrice(this._params.binding, kline);
        const buyPrice = bindingPrice * this._enterPriceFactor;
        return floorFloat(buyPrice, this._priceTickExpLevel);
    }

    private _calculateSellPrice(buyPrice: number): number {
        return floorFloat(buyPrice * this._exitPriceFactor, this._priceTickExpLevel);
    }

    private _calculateStopLossPrice(buyPrice: number): number|undefined {
        if (!this._stopLossPriceFactor) {
            return undefined;
        }
        const stopLossPrice = buyPrice * this._stopLossPriceFactor;
        return floorFloat(stopLossPrice, this._priceTickExpLevel);
    }

    private _checkSellHappensInKline(kline: IKline, deal: ISqueezeDeal, sellPrice: number, stopLossPrice: number|undefined, sellBinding: string) {
        if (kline[this._direction.minKeyName] < deal.minPrice) {
            deal.minPrice = kline[this._direction.minKeyName];
        }

        // be pessimistic, first check stop-losses and then sell
        if (stopLossPrice && kline[this._direction.minKeyName] <= stopLossPrice) {
            if (this._params.stopOnKlineClosed && sellPrice < kline.close) {
                deal.timeExit = kline.closeTime;
                deal.priceExit = sellPrice;
                return true;
            }
            // stop by price
            deal.isPercentStopLoss = true;
            deal.timeExit = kline.closeTime;
            deal.priceExit = this._params.stopOnKlineClosed ? kline.close : stopLossPrice;
            return true;
        }

        if (this._params.stopLossTime && kline.closeTime - deal.timeEnter > this._params.stopLossTime) {
            // stop by time
            deal.isTimeStopLoss = true;
            deal.timeExit = kline.closeTime;
            deal.priceExit = kline[this._direction.minKeyName];
            return true;
        }

        if (kline[sellBinding] > sellPrice) {
            // sell
            deal.timeExit = kline.closeTime;
            deal.priceExit = sellPrice;
            return true;
        }
        return false
    }

    private _calculateDeal(klines: IKline[], i: number, buyPrice: number): {deal: ISqueezeDeal, index: number} {
        const deal: ISqueezeDeal = {
            timeEnter: klines[i].openTime,
            timeExit: 0,
            priceEnter: buyPrice,
            priceExit: 0,
            minPrice: buyPrice,
            profitPercent: 0,
            drawdownPercent: 0
        }

        const sellPrice = this._calculateSellPrice(buyPrice);
        const stopLossPrice = this._calculateStopLossPrice(buyPrice);

        let isSold = this._checkSellHappensInKline(klines[i], deal, sellPrice, stopLossPrice, 'close')
        i++

        while (!isSold && i < klines.length) {
            isSold = this._checkSellHappensInKline(klines[i], deal, sellPrice, stopLossPrice, this._direction.maxKeyName)
            i++;
        }

        if (!isSold) {
            // sell by current price if no more data
            deal.timeExit = klines[klines.length - 1].closeTime
            deal.priceExit = klines[klines.length - 1].close
        }

        if (this._params.isShort) {
            deal.profitPercent = 100 / deal.priceExit * deal.priceEnter - 100 - (100 + 100 / deal.priceExit * deal.priceEnter) * this._commissionPercent / 100;
        } else {
            deal.profitPercent = 100 / deal.priceEnter * deal.priceExit - 100 - (100 + 100 / deal.priceEnter * deal.priceExit) * this._commissionPercent / 100;
        }

        deal.drawdownPercent = this._direction.multiplier * (deal.priceEnter - deal.minPrice) / deal.priceEnter * 100;
        delete deal.minPrice;

        deal.priceEnter *= this._direction.multiplier;
        deal.priceExit *= this._direction.multiplier;

        return {deal: deal, index: i}
    }

    calculate(klines: IKline[], klinesTf: string, progressBar?: IProgressListener): ISqueezeDealsStatistic {
        if (klines.length > 0 && klines[0].open * this._direction.multiplier < 0) {
            throw new Error(`The klines are not prepared for current direction. Please call invertKlines function before calculation`);
        }

        let lastDeal: ISqueezeDeal = undefined;
        const klineBuilder = new KlineBuilder(this._params.timeFrame, klinesTf);

        const deals: ISqueezeDeal[] = [];
        let nextBuyPrice: number = undefined;
        for (let i = 0; i < klines.length; i++) {
            progressBar?.onProgressUpdated(i, klines.length - 1)
            const kline = klines[i];
            const squeezeTfKline = klineBuilder.applyNewKline(klines[i]);
            const currentBuyPrice = nextBuyPrice;
            if (squeezeTfKline?.closed) {
                nextBuyPrice = this._calculateBuyPriceForKline(squeezeTfKline);
            }

            // there is a deal in progress
            if (lastDeal && lastDeal.timeExit >= kline.openTime) {
                continue;
            }

            // oncePerCandle logic
            if (this._params.oncePerCandle && 
                lastDeal && squeezeTfKline &&
                lastDeal.timeExit >= squeezeTfKline.openTime) {
                continue;
            }

            // check buy and sell
            if (currentBuyPrice && kline[this._direction.minKeyName] < currentBuyPrice) {
                const result = this._calculateDeal(klines, i, currentBuyPrice);
                lastDeal = result.deal;
                deals.push(result.deal);
            }
        }
        return this.calculateDealsStatistic(deals);
    }

    calculateDealsStatistic(deals: ISqueezeDeal[]): ISqueezeDealsStatistic {
        const result: ISqueezeDealsStatistic = {
            settings: this._params,
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
            }

            if (d.isTimeStopLoss || d.isTimeStopLoss) {
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