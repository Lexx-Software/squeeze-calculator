import { BestSqueezeFinder, ISqueezeOptimizationsParameters, OptimizationAlgorithm, BinanceExchange,
         IProgressListener, ISqueezeParameters, SqueezeBindings, SqueezeCalculator } from "squeeze-utils";

class ProgressBar implements IProgressListener {
    private _startTime: number;
    private _lastUpdateTime: number;
    private _lastPercent: number;

    constructor() {
        this.reset();
    }

    async onProgressUpdated(currentValue: number, total: number) {
        this._lastUpdateTime = Date.now();
        const percent = currentValue / total * 100;
        if (currentValue !== 0 && currentValue !== total && percent - this._lastPercent < 5) {
            return;
        }

        console.log('\t progress: %s%%', percent.toFixed(2));
        this._lastPercent = percent
    }

    getSpentSeconds(): number {
        return (this._lastUpdateTime - this._startTime) / 1000
    }

    reset() {
        this._lastPercent = 0;
        this._startTime = Date.now();
        this._lastUpdateTime = Date.now();
    }
}


async function findBestSqueeze(symbol: string, from: number, to: number, commissionPercent: number, settings: ISqueezeOptimizationsParameters) {
    const progressBar = new ProgressBar();

    console.log('Starting downloading data...')
    const exchange = new BinanceExchange('binance')
    const klines = await exchange.downloadKlines(symbol, '1m', from, to, progressBar);
    const symbolsTickers = await exchange.getSymbolsTickers();
    console.log('Downloaded in %s seconds', progressBar.getSpentSeconds().toFixed(3))
    
        
    console.log('Total possible variants: %s', BestSqueezeFinder.totalNumberVariants(settings));
    console.log('Starting calculation...')
    progressBar.reset()
    const finder = new BestSqueezeFinder(symbolsTickers[symbol], commissionPercent, klines, '1m', settings, progressBar);
    const bestStat =  await finder.findBestSqueeze();
    console.log('Finished calculation in %s seconds', progressBar.getSpentSeconds().toFixed(3))

    console.log('Result:\n%s', JSON.stringify(bestStat, null, 2));
}

async function calculateOne(exchangeName: 'binance'|'binance-futures', symbol: string, from: number, to: number, commissionPercent: number, params: ISqueezeParameters) {
    const progressBar = new ProgressBar();

    console.log('Starting downloading data...')
    const exchange = new BinanceExchange(exchangeName)
    const klines = await exchange.downloadKlines(symbol, '1m', from, to, progressBar);
    const symbolsTickers = await exchange.getSymbolsTickers();
    console.log('Downloaded in %s seconds', progressBar.getSpentSeconds().toFixed(3))

    const squeezeCalculator = new SqueezeCalculator(params, symbolsTickers[symbol], commissionPercent);
    const stat = squeezeCalculator.calculate(klines, '1m');

    console.log('Result:\n%s', JSON.stringify(stat, null, 2));
}

/*
// Example how to get the statistic for special config
calculateOne('binance', 'DATAUSDT', 1704063600000, 1704841200000, 0.075, {
    percentBuy: 1.0,
    percentSell: 0.5,
    binding: SqueezeBindings.LOW,
    stopLossTime: 24 * 60 * 1000,
    timeFrame: '1m',
    oncePerCandle: false
});
*/

findBestSqueeze('DATAUSDT', Date.now() - 30 * 24 * 60 * 60 * 1000, undefined, 0.075, {
    percentBuy: {
        from: 1,
        to: 10
    },
    percentSell: {
        from: 0.5,
        to: 5
    },
    binding: [SqueezeBindings.LOW, SqueezeBindings.CLOSE],
    stopLossTime: {
        from: 5,
        to: 60
    },
    stopLossPercent:{
        from: 1,
        to: 10
    },
    timeFrame: '1h',
    oncePerCandle: true,
    stopOnKlineClosed: true,
    algorithm: OptimizationAlgorithm.OMG,
    iterations: 1000,
    filters: {
        minNumDeals: 10
    }
});
