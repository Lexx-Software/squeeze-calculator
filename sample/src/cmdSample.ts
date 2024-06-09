import { BestSqueezeFinder, ISqueezeOptimizationsParameters, OptimizationAlgorithm, BinanceExchange,
         IProgressListener, ISqueezeParameters, SqueezeBindings, SqueezeCalculator, 
         invertKlines} from "squeeze-utils";

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
    let klines = await exchange.downloadKlines(symbol, '1m', from, to, progressBar);
    const symbolsTickers = await exchange.getSymbolsTickers();
    console.log('Downloaded in %s seconds', progressBar.getSpentSeconds().toFixed(3))

    if (params.isShort) {
        klines = invertKlines(klines);
    }
    const squeezeCalculator = new SqueezeCalculator(params, symbolsTickers[symbol], commissionPercent);
    const stat = squeezeCalculator.calculate(klines, '1m');

    console.log('Result:\n%s', JSON.stringify(stat, null, 2));
}


// Example how to get the statistic for special config
calculateOne('binance', 'SOLBTC', 1703768400000, 1703854800000, 0.075, {
    isShort: false,
    percentEnter: 1.1,
    percentExit: {
        from: 0.5,
        to: 3.0
    },
    binding: SqueezeBindings.CLOSE,
    stopLossTime: undefined,
    timeFrame: '5m',
    oncePerCandle: true
});

/*
findBestSqueeze('BTCUSDT', Date.now() - 7 * 24 * 60 * 60 * 1000, undefined, 0.075, {
    isShort: false,
    percentEnter: {
        from: 1,
        to: 10
    },
    percentExit: {
        from: 0.5,
        to: 5
    },
    binding: [SqueezeBindings.CLOSE],
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
    algorithm: OptimizationAlgorithm.RANDOM,
    iterations: 3000,
    filters: {
        //minNumDeals: 10
    }
});
*/