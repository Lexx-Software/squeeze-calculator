import { IKeyValueObject } from "./types";

export const TimeFrameSeconds = {
    '1m' : 60 * 1000,
    '3m' : 3 * 60 * 1000,
    '5m' : 5 * 60 * 1000,
    '10m' : 10 * 60 * 1000,
    '15m' : 15 * 60 * 1000,
    '30m' : 30 * 60 * 1000,
    '1h' : 60 * 60 * 1000,
    '4h' : 60 * 60 * 1000,
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

export function decimalAdjust(type, value, exp) {
    // If the exp is undefined or zero...
    if (typeof exp === 'undefined' || +exp === 0) {
        return Math[type](value);
    }
    value = +value;
    exp = +exp;
    // If the value is not a number or the exp is not an integer...
    if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
        return NaN;
    }
    // Shift
    value = value.toString().split('e');
    value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
    // Shift back
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
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
