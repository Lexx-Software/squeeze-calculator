export interface IKline {
    openTime: number;
    closeTime: number; 
    open: number;
    close: number;
    high: number;
    low: number;
    baseVolume: number;
    quoteVolume: number;
    trades?: number;
    buyBaseVolume?: number;
    buyQuoteVolume?: number;
    closed: boolean;
}

export interface IKeyValueObject {
    [key: string]: any;
}

export interface IRange {
    from: number;
    to: number;
}
