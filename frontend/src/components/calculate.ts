// import { BestSqueezeFinder, ISqueezeOptimizationsParameters } from '../../../../engine/bestSqueezeFinder';
import { BinanceExchange } from '../../../src/exchanges/binanceExchange';
import { IProgressListener } from '../../../src/iProgressListener';

class ProgressBar implements IProgressListener {
    private _startTime: number | undefined;
    private _lastUpdateTime: number | undefined;
    private _lastPercent: number | undefined;

    constructor() {
        this.reset();
    }

    onProgressUpdated(currentValue: number, total: number) {
        this._lastUpdateTime = Date.now();
        const percent = (currentValue / total) * 100;
        if (currentValue !== 0 && currentValue !== total && percent - Number(this._lastPercent || 0) < 5) {
            return;
        }

        console.log('\t progress: %s%%', percent.toFixed(2));
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

export async function calculateData(formData: any): Promise<void> {
    console.log('formData', formData); // @@@
    const symbol = formData.symbol;
    const from = Date.now() - 30 * 24 * 60 * 60 * 1000; // Date.now() - formData.time[0] // @@@
    const to = Date.now(); // Date.now() - formData.time[1] // @@@

    const progressBar = new ProgressBar();

    const exchange = new BinanceExchange(formData.exchange);
    const klines = await exchange.downloadKlines(symbol, '1m', from, to, progressBar);

    console.log('klines', klines); // @@@
}
