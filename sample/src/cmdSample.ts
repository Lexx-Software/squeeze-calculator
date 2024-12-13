import { BestSqueezeFinder, ISqueezeOptimizationsParameters,
         IProgressListener, ISqueezeParameters, SqueezeBindings, SqueezeCalculator, 
         invertKlines, buildExchange, Exchange} from "squeeze-utils";

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
    const exchange = buildExchange(Exchange.BINANCE)
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

async function calculateOne(exchangeName: Exchange, symbol: string, from: number, to: number, params: ISqueezeParameters) {
    const progressBar = new ProgressBar();

    console.log('Starting downloading data...')
    const exchange = buildExchange(exchangeName)
    let klines = await exchange.downloadKlines(symbol, '1m', from, to, progressBar);
    const symbolsTickers = await exchange.getSymbolsTickers();
    console.log('Downloaded in %s seconds', progressBar.getSpentSeconds().toFixed(3))

    if (params.isShort) {
        klines = invertKlines(klines);
    }
    const squeezeCalculator = new SqueezeCalculator(params, symbolsTickers[symbol], exchange.getDefaultCommission());
    const stat = squeezeCalculator.calculate(klines, '1m');

    console.log('Result:\n%s', JSON.stringify(stat, null, 2));
}


// Example how to get the statistic for special config
calculateOne(Exchange.BINANCE_FUTURES, 'MORPHOUSDT', 1732662000000, 1733007600000, {
    isShort: false,
    percentEnter: 4.5,
    percentExit: {
        from: 1.7,
        to: 1.9
    },
    binding: SqueezeBindings.CLOSE,
    stopLossTime: 255 * 60 * 1000,
    timeFrame: '1h',
    oncePerCandle: false
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