export const EXCHANGE = {
    BINANCE: 'binance',
    BINANCE_FUTURES: 'binance-futures',
};

export const EXCHANGE_TEXT = {
    [EXCHANGE.BINANCE]: 'Binance',
    [EXCHANGE.BINANCE_FUTURES]: 'Binance Futures',
};

export const TIMEFRAME_PERC_SETTINGS = {
    '1m': {
        buy: { from: 1, to: 6 },
        sell: { from: 0.5, to: 3 },
    },
    '3m': {
        buy: { from: 1, to: 6 },
        sell: { from: 0.5, to: 3 },
    },
    '5m': {
        buy: { from: 1, to: 8 },
        sell: { from: 0.5, to: 4 },
    },
    '15m': {
        buy: { from: 2, to: 10 },
        sell: { from: 1, to: 5 },
    },
    '30m': {
        buy: { from: 2, to: 10 },
        sell: { from: 1, to: 5 },
    },
    '1h': {
        buy: { from: 2, to: 15 },
        sell: { from: 1, to: 7.5 },
    },
    '2h': {
        buy: { from: 2, to: 15 },
        sell: { from: 1, to: 7.5 },
    },
    '4h': {
        buy: { from: 4, to: 15 },
        sell: { from: 2, to: 7.5 },
    },
    '6h': {
        buy: { from: 4, to: 15 },
        sell: { from: 2, to: 7.5 },
    },
    '8h': {
        buy: { from: 4, to: 15 },
        sell: { from: 2, to: 7.5 },
    },
    '12h': {
        buy: { from: 5, to: 30 },
        sell: { from: 2.5, to: 15 },
    },
    '1d': {
        buy: { from: 5, to: 30 },
        sell: { from: 2.5, to: 15 },
    },
}
