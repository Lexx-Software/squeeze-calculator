import { BestSqueezeFinder, ISqueezeOptimizationsParameters } from '../../../src/bestSqueezeFinder';
import { BinanceExchange } from '../../../src/exchanges/binanceExchange';
import { IProgressListener } from '../../../src/iProgressListener';

class ProgressBar implements IProgressListener {
    private _startTime: number | undefined;
    private _lastUpdateTime: number | undefined;
    private _lastPercent: number | undefined;
    cb: any;

    constructor(cb) {
        this.reset();
        this.cb = cb;
    }

    onProgressUpdated(currentValue: number, total: number) {
        this._lastUpdateTime = Date.now();
        const percent = (currentValue / total) * 100;
        if (currentValue !== 0 && currentValue !== total && percent - Number(this._lastPercent || 0) < 5) {
            return;
        }

        this.cb({ progress: percent.toFixed(2) })
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

export async function calculateData(formData: any, cb): Promise<any> {
    const symbol = formData.symbol;
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
        stopOnKlineClosed: formData.stopOnKlineClosed,
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
    if (formData.minNumDeals.isActive || formData.minCoeff.isActive || formData.minWinRate.isActive) {
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
    }
    
    const progressBar = new ProgressBar(cb);

    cb({ startDownload: true })

    const exchange = new BinanceExchange(formData.exchange);
    const klines = await exchange.downloadKlines(symbol, '1m', from, to, progressBar);

    const symbolsTickers = await exchange.getSymbolsTickers();

    cb({ downloadTime: progressBar.getSpentSeconds().toFixed(3) })
    
    progressBar.reset()

    cb({ startCalculate: true })

    const finder = new BestSqueezeFinder(symbolsTickers[symbol], commissionPercent, klines, settings, progressBar, saveResults);
    finder.findBestSqueeze();

    cb({ calculateTime: progressBar.getSpentSeconds().toFixed(3) })

    return {
        symbol,
        exchange: formData.exchange,
        stopOnKlineClosed: formData.stopOnKlineClosed,
        dataArr: finder.getAllAttemptsSqueezes(),
    };
}
