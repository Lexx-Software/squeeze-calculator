import { IKeyValueObject, IKline } from "./types";

export const SEC_MS = 1000;
export const MIN_MS = 60 * SEC_MS;
export const HOUR_MS = 60 * MIN_MS;
export const DAY_MS = 24 * HOUR_MS;

export const TimeFrameSeconds = {
    '1m' : 60 * 1000,
    '3m' : 3 * 60 * 1000,
    '5m' : 5 * 60 * 1000,
    '15m' : 15 * 60 * 1000,
    '30m' : 30 * 60 * 1000,
    '1h' : 60 * 60 * 1000,
    '2h' : 2 * 60 * 60 * 1000,
    '4h' : 4 * 60 * 60 * 1000,
    '6h' : 6 * 60 * 60 * 1000,
    '8h' : 8 * 60 * 60 * 1000,
    '12h' : 12 * 60 * 60 * 1000,
    '1d' : 24 * 60 * 60 * 1000
}

export function removeUndefined<T extends IKeyValueObject>(obj: T): T {
    Object.keys(obj).forEach(key => {
        if (obj[key] === undefined) {
            delete obj[key];
        }
    })
    return obj;
}


export function sortedArrayIndex<T>(array: T[], value: T, compareFunc: (a: T, b: T) => boolean = (a: T, b: T) => a < b): number {
    let low = 0;
    let high = array.length;

    while (low < high) {
        const mid = (low + high) >>> 1;
        if (compareFunc(array[mid], value)) {
            low = mid + 1;
        } else {
            high = mid;
        }
    }
    return low;
}

export function floorFloat(num: number, precision: number): number {
    let str = `${num}`;
    let idx = 0;
    const strLen = str.length;
    while (idx < strLen && str[idx] != '.') {
        idx++
    }

    const len = idx + precision + 1
    if (strLen > len) {
        str = str.substring(0, len);
    }

    return parseFloat(str);
}

export function invertKlines(klines: IKline[]): IKline[] {
    const result = [];
    for (const kline of klines) {
        result.push({
            openTime: kline.openTime,
            closeTime: kline.closeTime,
            open: -kline.open,
            close: -kline.close,
            high: -kline.high,
            low: -kline.low,
            baseVolume: kline.baseVolume,
            quoteVolume: kline.quoteVolume,
            trades: kline.trades,
            buyBaseVolume: kline.buyBaseVolume,
            buyQuoteVolume: kline.buyQuoteVolume,
            closed: kline.closed,
        });
    }
    return result;
}

export function deepCopy<T>(o: T): T {
    let newO,
    i;

    if (typeof o !== 'object') {
        return o;
    }
    if (!o) {
        return o;
    }

    if (Array.isArray(o)) {
        newO = [];
        for (i = 0; i < o.length; i += 1) {
            newO[i] = deepCopy(o[i]);
        }
        return newO;
    }

    newO = {};
    for (i in o) {
        if (o.hasOwnProperty(i)) {
            newO[i] = deepCopy(o[i]);
        }
    }
    return newO;
}

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function getPrecision(num: number): number {
    // Convert to string and handle scientific notation
    const str = num.toString();
    const eIndex = str.indexOf('e');
    
    // Handle scientific notation
    if (eIndex !== -1) {
        const base = str.substring(0, eIndex);
        const exp = parseInt(str.substring(eIndex + 1));
        const dotIndex = base.indexOf('.');
        if (dotIndex === -1) return 0;
        
        const precision = base.length - dotIndex - 1 - exp;
        return precision > 0 ? precision : 0;
    }

    // Handle regular decimal
    const dotIndex = str.indexOf('.');
    return dotIndex === -1 ? 0 : str.length - dotIndex - 1;
}


function getMaxPrecision(numbers: number[]): number {
    return Math.max(...numbers.map(getPrecision));
}

export function getKlinesPricePrecision(klines: IKline[]): number {
    // Pre-allocate array size for better performance
    const prices = new Array(klines.length * 4);
    let i = 0;
    
    for (const kline of klines) {
        prices[i++] = kline.open;
        prices[i++] = kline.close; 
        prices[i++] = kline.high;
        prices[i++] = kline.low;
    }
    
    return getMaxPrecision(prices);
}