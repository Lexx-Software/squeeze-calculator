import { BestSqueezeFinder, ISqueezeOptimizationsParameters, BinanceExchange, IProgressListener } from 'squeeze-utils';

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class ProgressBar implements IProgressListener {
    private _startTime: number | undefined;
    private _lastUpdateTime: number | undefined;
    private _lastPercent: number | undefined;

    constructor(private _cb) {
        this.reset();
    }

    async onProgressUpdated(currentValue: number, total: number): Promise<void> {
        this._lastUpdateTime = Date.now();
        const percent = (currentValue / total) * 100;
        if (currentValue !== 0 && currentValue !== total && percent - Number(this._lastPercent || 0) < 5) {
            return;
        }

        this._cb({ progress: percent.toFixed(2) })
        await sleep(1);
        this._lastPercent = percent;
    }

    getSpentSeconds(): number {
        return (Number(this._lastUpdateTime || 0) - Number(this._startTime || 0)) / 1000;
    }

    reset() {
        this._lastPercent = 0;
        this._startTime = Date.now();
        this._lastUpdateTime = Date.now();
    }
}

const klinesCache = {
    name: '',
    klines: undefined,
    tickers: undefined
}

export async function calculateData(formData: any, cb): Promise<any> {
    const symbol = formData.symbol.toUpperCase();
    const from = new Date(formData.time[0]).getTime()
    const to = new Date(formData.time[1]).getTime()
    const commissionPercent = formData.fee;
    const saveResults = formData.saveResults;
    const binding = [];
    for (const key of Object.keys(formData.binding)) {
        if (formData.binding[key] === true) {
            binding.push(key);
        }
    }
    const settings: ISqueezeOptimizationsParameters = {
        percentBuy: {
            from: formData.percentBuyFrom,
            to: formData.percentBuyTo,
        },
        percentSell: {
            from: formData.percentSellFrom,
            to: formData.percentSellTo,
        },
        binding,
        algorithm: formData.algorithm,
        iterations: formData.iterations
    }
    if (formData.stopLossTime.isActive) {
        settings.stopLossTime = {
            from: formData.stopLossTime.from,
            to: formData.stopLossTime.to,
        }
    }
    if (formData.stopLossPercent.isActive) {
        settings.stopLossPercent = {
            from: formData.stopLossPercent.from,
            to: formData.stopLossPercent.to,
        }
    }
    if (formData.stopLossPercent.isActive) {
        settings.stopOnKlineClosed = formData.stopOnKlineClosed;
    }
    if (formData.minNumDeals.isActive || formData.minCoeff.isActive || formData.minWinRate.isActive || formData.maxSellBuyRatio.isActive) {
        settings.filters = {};
        if (formData.minNumDeals.isActive) {
            settings.filters.minNumDeals = formData.minNumDeals.value;
        }
        if (formData.minCoeff.isActive) {
            settings.filters.minCoeff = formData.minCoeff.value;
        }
        if (formData.minWinRate.isActive) {
            settings.filters.minWinRate = formData.minWinRate.value;
        }
        if (formData.maxSellBuyRatio.isActive) {
            settings.filters.maxSellBuyRatio = formData.maxSellBuyRatio.value;
        }
    }
    
    const progressBar = new ProgressBar(cb);

    cb({ startDownload: true })

    const klinesCacheName = `${formData.exchange}_${symbol}_${from}_${to}`;
    if (klinesCache.name !== klinesCacheName) {
        const exchange = new BinanceExchange(formData.exchange);
        klinesCache.klines = await exchange.downloadKlines(symbol, '1m', from, to, progressBar);
        klinesCache.tickers = await exchange.getSymbolsTickers();
        klinesCache.name = klinesCacheName;
    }

    cb({ downloadTime: progressBar.getSpentSeconds().toFixed(3) })
    
    progressBar.reset()

    cb({ startCalculate: true })

    await sleep(1);

    const finder = new BestSqueezeFinder(klinesCache.tickers[symbol], commissionPercent, klinesCache.klines, settings, progressBar, saveResults);
    await finder.findBestSqueeze();

    cb({ calculateTime: progressBar.getSpentSeconds().toFixed(3) })

    return {
        symbol,
        exchange: formData.exchange,
        stopOnKlineClosed: settings.stopOnKlineClosed || false,
        dataArr: finder.getAllAttemptsSqueezes(),
    };
}
