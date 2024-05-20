import { IProgressListener } from "./iProgressListener";
import { ISqueezeDealsStatistic, ISqueezeParameters, SqueezeBindings, SqueezeCalculator } from "./squeezeCalculator";
import { IKline, IRange } from "./types";
import { floorFloat, invertKlines, sortedArrayIndex } from './utils';
import { BaseOptVar, CategoricalOptVar, ConstantOptVar, IntegerOptVar, OptimizationAlgorithm, OptimizersMap } from './optimization';

export interface ISqueezeOptimizationsParameters {
    isShort: boolean;
    percentEnter: IRange;
    percentExit: IRange;
    binding: SqueezeBindings[];
    stopLossTime?: IRange; // mins
    stopLossPercent?: IRange;
    stopOnKlineClosed?: boolean;
    timeFrame: string;
    oncePerCandle: boolean;
    algorithm: OptimizationAlgorithm;
    iterations: number;
    filters?: {
        minNumDeals?: number;
        minCoeff?: number;
        minWinRate?: number;
        maxSellBuyRatio?: number;
    }
}

const PERCENT_ACCURACY = 10

export class BestSqueezeFinder {
    private _currentIteration: number = 0;
    private _numIterations: number = 0;
    private _topIterations: ISqueezeDealsStatistic[];

    constructor(private _symbolsTicker: number,
                private _commissionPercent: number,
                private _klines: IKline[],
                private _klinesTimeFrame: string, 
                private _params: ISqueezeOptimizationsParameters,
                private _progressBar?: IProgressListener,
                private _numTopTries: number = 20) {
        if (this._params.isShort) {
            this._klines = invertKlines(_klines);
        }
    }

    private static _convertToDims(params: ISqueezeOptimizationsParameters): BaseOptVar[] {
        return [
            new IntegerOptVar(params.percentEnter.from * PERCENT_ACCURACY, params.percentEnter.to * PERCENT_ACCURACY),      // percentEnter
            new CategoricalOptVar(params.binding),                                                                          // binding
            params.stopLossTime ? new IntegerOptVar(params.stopLossTime.from, params.stopLossTime.to) : new ConstantOptVar(undefined),           // stopLossTime
            params.stopLossPercent ? new IntegerOptVar(params.stopLossPercent.from * PERCENT_ACCURACY, params.stopLossPercent.to * PERCENT_ACCURACY) : new ConstantOptVar(undefined),  // stopLossPercent
        ];
    }

    public static totalNumberVariants(params: ISqueezeOptimizationsParameters): number {
        return BestSqueezeFinder._convertToDims(params).reduce((p, c) => p * c.numVariants(), 1);
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
                if (this._topIterations[i].settings.percentEnter != stat.settings.percentEnter 
                    || this._topIterations[i].settings.percentExit != stat.settings.percentExit
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
            isShort: this._params.isShort,
            percentEnter: x[0] / PERCENT_ACCURACY,
            percentExit: this._params.percentExit,
            binding: x[1],
            stopLossTime: x[2] ? x[2] * 60 * 1000 : undefined,
            stopLossPercent: x[3] ? x[3] / PERCENT_ACCURACY : undefined,
            stopOnKlineClosed: this._params.stopOnKlineClosed,
            timeFrame: this._params.timeFrame,
            oncePerCandle: this._params.oncePerCandle
        }
        await this._progressBar?.onProgressUpdated(this._currentIteration++, this._numIterations)

        // check maxSellBuyRatio
        if (this._params.filters?.maxSellBuyRatio) {
            const maxPercentExit = floorFloat(params.percentEnter * this._params.filters.maxSellBuyRatio * 10, 1);

            if (typeof params.percentExit === 'number') {
                if (params.percentExit > maxPercentExit) {
                    return 0;
                }
            } else {
                if (params.percentExit.from > maxPercentExit) {
                    return 0;
                }

                if (params.percentExit.to > maxPercentExit ) {
                    params.percentExit.to = maxPercentExit
                }

                params.percentExit.to = Math.min()
            }
        }

        // do calculation
        const squeezeCalculator = new SqueezeCalculator(params, this._symbolsTicker, this._commissionPercent);
        const stats = squeezeCalculator.calculate(this._klines, this._klinesTimeFrame);

        let bestStatPassesFilters: ISqueezeDealsStatistic = undefined;
        let bestStat: ISqueezeDealsStatistic = undefined;
        for (const stat of stats) {
            const passesFilters = this._passesUserFilters(stat);
            if (stat.totalDeals > 0 && passesFilters) {
                this._addIterationResult(stat);
                if (!bestStatPassesFilters || bestStatPassesFilters.totalProfitPercent < stat.totalProfitPercent) {
                    bestStatPassesFilters = stat;
                }
            }

            if (!bestStat || bestStat.totalProfitPercent < stat.totalProfitPercent) {
                bestStat = stat;
            }
        }

        // we have a result but it does not meet user filters
        if (!bestStatPassesFilters) {
            if (this._topIterations.length == 0) {
                // no iterations were done -> skip it
                return -Math.min(0, bestStat.totalProfitPercent);
            }

            if (this._topIterations[0].totalProfitPercent >= bestStat.totalProfitPercent) {
                // this is not a best iteration => add 30% fine
                return bestStat.totalProfitPercent > 0 ? -bestStat.totalProfitPercent * 0.70 : -bestStat.totalProfitPercent
            } else {
                // this is the best iteration => make it not a best one
                return -this._topIterations[0].totalProfitPercent * 0.9
            }
        }

        return -bestStatPassesFilters.totalProfitPercent;
    }

    async _optimizationJsMinimize(optimizer): Promise<void> {
        for(var iter=0; iter < this._numIterations; iter++){
            var x = optimizer.ask()
            var y = await this._squeezeOptimizationFunctionOptimjs(x)
            optimizer.tell([x], [y])
        }
    }

    async findBestSqueeze(): Promise<ISqueezeDealsStatistic> {
        this._currentIteration = 0;
        this._topIterations = []

        const dims = BestSqueezeFinder._convertToDims(this._params);


        let algorithm = this._params.algorithm;

        const maxIterations = BestSqueezeFinder.totalNumberVariants(this._params);
        this._numIterations = this._params.iterations;
        if (this._numIterations >= maxIterations) {
            this._numIterations = maxIterations;
            algorithm = OptimizationAlgorithm.ALL;
        }

        await this._optimizationJsMinimize(OptimizersMap[algorithm](dims, this._numIterations));
        await this._progressBar?.onProgressUpdated(this._numIterations, this._numIterations);
        return this._topIterations && this._topIterations[0];
    }

    getAllAttemptsSqueezes(): ISqueezeDealsStatistic[] {
        return this._topIterations
    }
}