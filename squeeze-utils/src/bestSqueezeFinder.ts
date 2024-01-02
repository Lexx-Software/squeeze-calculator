import * as optimjs from 'optimization-js'
import { IProgressListener } from "./iProgressListener";
import { ISqueezeDealsStatistic, ISqueezeParameters, SqueezeBindings, SqueezeCalculator } from "./squeezeCalculator";
import { IKline } from "./types";
import { sortedArrayIndex } from './utils';

export enum OptimizationAlgorithm {
    OMG = 'OMG',
    RANDOM = 'random'
}

export interface ISqueezeOptimizationsParameters {
    percentBuy: {
        from: number;
        to: number;
    };
    percentSell: {
        from: number;
        to: number;
    };
    binding: SqueezeBindings[];
    stopLossTime?: {
        from: number;   // mins
        to: number;     // mins
    };
    stopLossPercent?:{
        from: number;
        to: number;
    };
    stopOnKlineClosed?: boolean;
    algorithm: OptimizationAlgorithm;
    iterations: number;
    filters?: {
        minNumDeals?: number;
        minCoeff?: number;
        minWinRate?: number;
        maxSellBuyRatio?: number;
    }
}

const OptimizationJsFunctionsMap: {[name: string]: string} = {
    [OptimizationAlgorithm.RANDOM]: 'RandomOptimizer',
    [OptimizationAlgorithm.OMG]: 'OMGOptimizer'
}

export class BestSqueezeFinder {
    private _currentIteration: number = 0;
    private _topIterations: ISqueezeDealsStatistic[];

    constructor(private _symbolsTicker: number,
                private _commissionPercent: number,
                private _klines: IKline[],
                private _params: ISqueezeOptimizationsParameters,
                private _progressBar?: IProgressListener,
                private _numTopTries: number = 20) {
        
    }

    private _addIterationResult(stat: ISqueezeDealsStatistic) {
        const totalProfitPercentOriginal = stat.totalProfitPercent
        stat.totalProfitPercent = totalProfitPercentOriginal + 0.000001
        const insertIdxLeft = sortedArrayIndex(this._topIterations, stat, (a, b) => a.totalProfitPercent > b.totalProfitPercent);
        if (insertIdxLeft > this._numTopTries) {
            return;
        }

        stat.totalProfitPercent = totalProfitPercentOriginal - 0.000001
        const insertIdxRight = sortedArrayIndex(this._topIterations, stat, (a, b) => a.totalProfitPercent > b.totalProfitPercent);
        stat.totalProfitPercent = totalProfitPercentOriginal;

        if (insertIdxLeft != insertIdxRight) {
            // there are several elements with such profit, so try to combine them if it makes sense
            for (let i = insertIdxLeft; i < insertIdxRight; i++) {
                if (this._topIterations[i].settings.percentBuy != stat.settings.percentBuy 
                    || this._topIterations[i].settings.percentSell != stat.settings.percentSell
                    || this._topIterations[i].settings.binding != stat.settings.binding
                    || this._topIterations[i].settings.stopOnKlineClosed != stat.settings.stopOnKlineClosed ) {
                    continue;
                }
                if (this._topIterations[i].settings.stopLossPercent == stat.settings.stopLossPercent) {
                    if (this._topIterations[i].settings.stopLossTime > stat.settings.stopLossTime) {
                        this._topIterations[i] = stat;
                    }
                    return;
                }
                if (this._topIterations[i].settings.stopLossTime == stat.settings.stopLossTime) {
                    if (this._topIterations[i].settings.stopLossPercent > stat.settings.stopLossPercent) {
                        this._topIterations[i] = stat;
                    }
                    return;
                }
            }
        }

        this._topIterations.splice(insertIdxLeft, 0, stat);

        if (this._topIterations.length > this._numTopTries) {
            this._topIterations.pop();
        }
    }
    
    private _passesUserFilters(stat: ISqueezeDealsStatistic): boolean {
        if (!this._params.filters) {
            return true;
        }

        if (this._params.filters.minNumDeals && stat.totalDeals < this._params.filters.minNumDeals) {
            return false;
        }

        if (this._params.filters.minCoeff && stat.coeff && stat.coeff < this._params.filters.minCoeff) {
            return false;
        }

        if (this._params.filters.minWinRate && stat.winRate < this._params.filters.minWinRate) {
            return false;
        }

        return true;
    }

    private async _squeezeOptimizationFunctionOptimjs(x: any[]): Promise<number> {
        const params: ISqueezeParameters = {
            percentBuy: x[0] / 10,
            percentSell: x[1] / 10,
            binding: x[2],
            stopLossTime: x[3] ? x[3] * 60 * 1000 : undefined,
            stopLossPercent: x[4] ? x[4] / 10 : undefined,
            stopOnKlineClosed: x[5]
        }
        await this._progressBar?.onProgressUpdated(this._currentIteration++, this._params.iterations)

        // check maxSellBuyRatio
        if (this._params.filters?.maxSellBuyRatio && (this._params.filters.maxSellBuyRatio + 0.1e-10) < params.percentSell / params.percentBuy) {
            return 0;
        }

        // do calculation
        const squeezeCalculator = new SqueezeCalculator(params, this._symbolsTicker, this._commissionPercent);
        const stat = squeezeCalculator.calculate(this._klines);
        const passesFilters = this._passesUserFilters(stat);
        if (stat.totalDeals > 0 && passesFilters) {
            this._addIterationResult(stat)
        }

        // we have a result but it does not meet user filters
        if (!passesFilters) {
            if (this._topIterations.length == 0) {
                // no iterations were done -> skip it
                return -Math.min(0, stat.totalProfitPercent);
            }

            if (this._topIterations[0].totalProfitPercent >= stat.totalProfitPercent) {
                // this is not a best iteration => add 30% fine
                return stat.totalProfitPercent > 0 ? -stat.totalProfitPercent * 0.70 : -stat.totalProfitPercent
            } else {
                // this is the best iteration => make it not a best one
                return -this._topIterations[0].totalProfitPercent * 0.9
            }
        }

        return -stat.totalProfitPercent;
    }

    async _optimizationJsMinimize(optimizer): Promise<void> {
        for(var iter=0; iter < this._params.iterations; iter++){
            var x = optimizer.ask()
            var y = await this._squeezeOptimizationFunctionOptimjs(x)
            optimizer.tell([x], [y])
        }
    }

    async findBestSqueeze(): Promise<ISqueezeDealsStatistic> {
        this._currentIteration = 0;
        this._topIterations = []

        const dims = [
            optimjs.Integer(this._params.percentBuy.from * 10, this._params.percentBuy.to * 10),    // percentBuy
            optimjs.Integer(this._params.percentSell.from * 10, this._params.percentSell.to * 10),  // percentSell
            optimjs.Categorical(this._params.binding),                                              // binding
            this._params.stopLossTime ? optimjs.Integer(this._params.stopLossTime.from, this._params.stopLossTime.to) : optimjs.Categorical([undefined]),           // stopLossTime
            this._params.stopLossPercent ? optimjs.Integer(this._params.stopLossPercent.from * 10, this._params.stopLossPercent.to * 10) : optimjs.Categorical([undefined]),  // stopLossPercent
            optimjs.Categorical([this._params.stopOnKlineClosed || false])                          // stopOnKlineClosed
        ];
 
        await this._optimizationJsMinimize(optimjs[OptimizationJsFunctionsMap[this._params.algorithm]](dims));

        await this._progressBar?.onProgressUpdated(this._params.iterations, this._params.iterations);

        return this._topIterations && this._topIterations[0];
    }

    getAllAttemptsSqueezes(): ISqueezeDealsStatistic[] {
        return this._topIterations
    }
}