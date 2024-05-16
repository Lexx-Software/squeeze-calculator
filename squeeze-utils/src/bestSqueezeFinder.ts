import { IProgressListener } from "./iProgressListener";
import { ISqueezeDealsStatistic, ISqueezeParameters, SqueezeBindings, SqueezeCalculator } from "./squeezeCalculator";
import { IKline } from "./types";
import { invertKlines, sortedArrayIndex } from './utils';
import { BaseOptVar, CategoricalOptVar, ConstantOptVar, IntegerOptVar, OptimizationAlgorithm, OptimizersMap } from './optimization';

export interface ISqueezeOptimizationsParameters {
    isShort: boolean;
    percentEnter: {
        from: number;
        to: number;
    };
    percentExit: {
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
            new IntegerOptVar(params.percentExit.from * PERCENT_ACCURACY, params.percentExit.to * PERCENT_ACCURACY),        // percentExit
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
            percentExit: x[1] / PERCENT_ACCURACY,
            binding: x[2],
            stopLossTime: x[3] ? x[3] * 60 * 1000 : undefined,
            stopLossPercent: x[4] ? x[4] / PERCENT_ACCURACY : undefined,
            stopOnKlineClosed: this._params.stopOnKlineClosed,
            timeFrame: this._params.timeFrame,
            oncePerCandle: this._params.oncePerCandle
        }
        await this._progressBar?.onProgressUpdated(this._currentIteration++, this._params.iterations)

        // check maxSellBuyRatio
        if (this._params.filters?.maxSellBuyRatio && (this._params.filters.maxSellBuyRatio + 0.1e-10) < params.percentExit / params.percentEnter) {
            return 0;
        }

        // do calculation
        const squeezeCalculator = new SqueezeCalculator(params, this._symbolsTicker, this._commissionPercent);
        const stat = squeezeCalculator.calculate(this._klines, this._klinesTimeFrame);
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

        const dims = BestSqueezeFinder._convertToDims(this._params);
        await this._optimizationJsMinimize(OptimizersMap[this._params.algorithm](dims, this._params.iterations));
        await this._progressBar?.onProgressUpdated(this._params.iterations, this._params.iterations);
        return this._topIterations && this._topIterations[0];
    }

    getAllAttemptsSqueezes(): ISqueezeDealsStatistic[] {
        return this._topIterations
    }
}