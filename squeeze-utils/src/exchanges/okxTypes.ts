export enum OkxTickerNames {
    OPEN_TIME = 0,                  // Opening time of the candlestick, Unix timestamp format in milliseconds, e.g. 1597026383085
    OPEN,
    HIGH,
    LOW,
    CLOSE,
    VOLUME,                         // Trading volume, with a unit of currency.
    QUOTE_ASSET_VOLUME,             // Trading volume, the value is the quantity in quote currency
    QUOTE_ASSET_VOLUME2,            // Trading volume, the value is the quantity in quote currency
    CONFIRM                         // The state of candlesticks: 0: K line is uncompleted, 1: K line is completed
}

export enum OkxInstType {
    SPOT = 'SPOT',
    MARGIN = 'MARGIN',
    SWAP = 'SWAP',          // Perpetual Futures
    FUTURES = 'FUTURES',    // Expiry Futures
    OPTION = 'OPTION'
}

export type IOkxTimeFrame = '1m' | '3m' | '5m' | '15m' | '30m' | '1H' | '2H' | '4H' | '6Hutc' | '12Hutc' | '1Dutc' | '2Dutc' | '3Dutc' | '1Wutc' | '1Mutc' | '3Mutc'

export const TIME_FRAME_TO_OKX_TIME_FRAME_MAP:{[key: string]: IOkxTimeFrame} = {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '30m': '30m',
    '1h': '1H',
    '2h': '2H',
    '4h': '4H',
    '1d': '1Dutc',
    '1w': '1Wutc'
};

export enum OkxInstStatus {
    live = 'live',
    suspend = 'suspend',
    preopen = 'preopen',    //  e.g. There will be preopen before the Futures and Options new contracts state is live.
    test = 'test'           // Test pairs, can't be traded
};

export interface IOkxSymbolInfo {
    "alias": string;                              // "", Alias
    "baseCcy": string;                            // "BTC", Base currency, e.g. BTC inBTC-USDT
    "category": string;                           //"1", Currency category. Note: this parameter is already deprecated
    "ctMult": string;                             //"", Contract multiplier
    "ctType": string;                             //"", Contract type
    "ctVal": string;                              //"", Contract value
    "ctValCcy": string;                           //"", Contract value currency
    "expTime": string;                            //"", Expiry time
    "instFamily": string;                         //"", Instrument family, e.g. BTC-USD
    "instId": string;                             //"BTC-USDT", Instrument ID,
    "instType": OkxInstType;                      //"SPOT", Instrument type
    "lever": string;                              //"10", Max Leverage,
    "listTime": string;                           //"1606468572000", Listing time, Unix timestamp format in milliseconds, e.g. 1597026383085
    "lotSz": string;                              //"0.00000001", Lot size
    "maxIcebergSz": string;                       //"9999999999.0000000000000000", The maximum order quantity of a single iceBerg order.
    "maxLmtAmt": string;                          //"1000000", Max USD amount for a single limit order
    "maxLmtSz": string;                           //"9999999999", The maximum order quantity of a single limit order.
    "maxMktAmt": string;                          //"1000000", Max USD amount for a single market order
    "maxMktSz": string;                           //"", The maximum order quantity of a single market order.
    "maxStopSz": string;                          //"", The maximum order quantity of a single stop market order.
    "maxTriggerSz": string;                       //"9999999999.0000000000000000", The maximum order quantity of a single trigger order.
    "maxTwapSz": string;                          //"9999999999.0000000000000000", The maximum order quantity of a single TWAP order.
    "minSz": string;                              //"0.00001", Minimum order size
    "optType": string;                            //"", Option type, C: Call P: put
    "quoteCcy": string;                           //"USDT", Quote currency, e.g. USDT in BTC-USDT
    "settleCcy": string;                          //"", Settlement and margin currency, e.g. BTC
    "state": OkxInstStatus;                       //"live", Instrument status
    "stk": string;                                //"", Strike price
    "tickSz": string;                             //"0.1", Tick size, e.g. 0.0001
    "uly": string;                                //"" Underlying, e.g. BTC-USD
}