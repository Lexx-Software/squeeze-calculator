import { IProgressListener } from "./iProgressListener";
import { IKline } from "./types";
import { decimalAdjust } from "./utils";


export enum SqueezeBindings {
    LOW = 'low',
    HIGH = 'high',
    OPEN = 'open',
    CLOSE = 'close',
    MID_HL = 'mid_hl',
    MID_OC = 'mid_oc'
}

export interface ISqueezeDeal {
    timeBuy: number;
    timeSell: number;
    priceBuy: number;
    priceSell: number;
    profitPercent: number;
    isTimeStopLoss?: boolean;
    isPercentStopLoss?: boolean;
}

export interface ISqueezeDealsStatistic {
    settings: ISqueezeParameters;
    totalProfitPercent: number;
    totalDeals: number;
    numStopLossDeals: number;
    numProfitDeals: number;
    coeff: number;
    winRate: number;
    deals: ISqueezeDeal[];
}

export interface ISqueezeParameters {
    percentBuy: number;
    percentSell: number;
    binding: SqueezeBindings;
    stopLossTime?: number;
    stopLossPercent?: number;
    stopOnKlineClosed?: boolean;
}


export class SqueezeCalculator {
    private _buyPriceFactor: number;
    private _sellPriceFactor: number;
    private _stopLossPriceFactor: number;
    private _priceTickExpLevel: number;

    constructor(private _params: ISqueezeParameters, priceTick: number, private _commissionPercent: number) {
        // optimization precalculations
        this._buyPriceFactor = (100 - _params.percentBuy) / 100;
        this._sellPriceFactor = (100 + _params.percentSell) / 100;
        if (_params.stopLossPercent) {
            this._stopLossPriceFactor = (100 - _params.stopLossPercent) / 100;
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
        const buyPrice = bindingPrice * this._buyPriceFactor;
        return decimalAdjust('floor', buyPrice, -this._priceTickExpLevel);
    }

    private _calculateSellPrice(buyPrice: number): number {
        return decimalAdjust('floor', buyPrice * this._sellPriceFactor, -this._priceTickExpLevel);
    }

    private _calculateStopLossPrice(buyPrice: number): number|undefined {
        if (!this._stopLossPriceFactor) {
            return undefined;
        }
        const stopLossPrice = buyPrice * this._stopLossPriceFactor;
        return decimalAdjust('floor', stopLossPrice, -this._priceTickExpLevel);
    }

    private _checkSellHappensInKline(kline: IKline, deal: ISqueezeDeal, sellPrice: number, stopLossPrice: number|undefined, sellBinding: 'high' | 'close' = 'high') {
        // be pessimistic, first check stop-losses and then sell
        if (stopLossPrice && kline.low <= stopLossPrice) {
            if (this._params.stopOnKlineClosed && sellPrice < kline.close) {
                deal.timeSell = kline.closeTime;
                deal.priceSell = sellPrice;
                return true;
            }
            // stop by price
            deal.isPercentStopLoss = true;
            deal.timeSell = kline.closeTime;
            deal.priceSell = this._params.stopOnKlineClosed ? kline.close : stopLossPrice;
            return true;
        }

        if (this._params.stopLossTime && kline.closeTime - deal.timeBuy > this._params.stopLossTime) {
            if (this._params.stopOnKlineClosed && sellPrice < kline.close) {
                deal.timeSell = kline.closeTime;
                deal.priceSell = sellPrice;
                return true;
            }
            // stop by time
            deal.isTimeStopLoss = true;
            deal.timeSell = kline.closeTime;
            deal.priceSell = this._params.stopOnKlineClosed ? kline.close : stopLossPrice as number;
            return true;
        }

        if (kline[sellBinding] > sellPrice) {
            // sell
            deal.timeSell = kline.closeTime;
            deal.priceSell = sellPrice;
            return true;
        }
        return false
    }

    private _calculateDeal(klines: IKline[], i: number, buyPrice: number): {deal: ISqueezeDeal, index: number} {
        const deal: ISqueezeDeal = {
            timeBuy: klines[i].openTime,
            timeSell: 0,
            priceBuy: buyPrice,
            priceSell: 0,
            profitPercent: 0
        }

        const sellPrice = this._calculateSellPrice(buyPrice);
        const stopLossPrice = this._calculateStopLossPrice(buyPrice);

        let isSold = this._checkSellHappensInKline(klines[i], deal, sellPrice, stopLossPrice, 'close')
        i++

        while (!isSold && i < klines.length) {
            isSold = this._checkSellHappensInKline(klines[i], deal, sellPrice, stopLossPrice)
            i++;
        }

        if (!isSold) {
            // sell by current price if no more data
            deal.timeSell = klines[klines.length - 1].closeTime
            deal.priceSell = klines[klines.length - 1].close
        }

        deal.profitPercent = 100 / deal.priceBuy * deal.priceSell - 100 - (100 + 100 / buyPrice * sellPrice) * this._commissionPercent / 100;

        return {deal: deal, index: i}
    }

    calculate(klines: IKline[], progressBar?: IProgressListener): ISqueezeDealsStatistic {
        const deals: ISqueezeDeal[] = [];
        let buyPrice: number = 0;
        for (let i = 0; i < klines.length; i++) {
            progressBar?.onProgressUpdated(i, klines.length - 1)
            const kline = klines[i];
            if (kline.low < buyPrice) {
                const result = this._calculateDeal(klines, i, buyPrice);
                deals.push(result.deal);
                i = result.index;
            }
            buyPrice = this._calculateBuyPriceForKline(kline);
        }
        return this.calculateDealsStatistic(deals);
    }

    calculateDealsStatistic(deals: ISqueezeDeal[]): ISqueezeDealsStatistic {
        const result: ISqueezeDealsStatistic = {
            settings: this._params,
            totalProfitPercent: 0,
            totalDeals: deals.length,
            numStopLossDeals: 0,
            numProfitDeals: 0,
            coeff: undefined,
            winRate: 100,
            deals: deals
        }

        let sumStops = 0;
        let sumTakes = 0;

        for (const d of deals) {
            result.totalProfitPercent += d.profitPercent;
            if (d.profitPercent < 0) {
                result.numStopLossDeals += 1;
                sumStops += d.profitPercent;
            } else {
                result.numProfitDeals += 1;
                sumTakes += d.profitPercent;
            }
        }
        if (sumStops != 0) {
            result.coeff = -sumTakes/sumStops
        }
        if (deals.length > 0) {
            result.winRate = result.numProfitDeals / deals.length
        }

        return result;
    }
}