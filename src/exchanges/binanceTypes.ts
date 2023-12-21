export enum BinanceTickerNames {
    OPEN_TIME = 0,
    OPEN,
    HIGH,
    LOW,
    CLOSE,
    VOLUME,
    CLOSE_TIME,
    QUOTE_ASSET_VOLUME,
    NUMBER_OF_TRADES,
    TAKER_BUY_BASE_ASSET_VOLUME,
    TAKER_BUY_QUOTE_ASSET_VOLUME,
    IGNORE
}

export enum BinanceOrderType
{
    LIMIT = "LIMIT",
    MARKET = "MARKET",
    STOP_LOSS = "STOP_LOSS",
    STOP_LOSS_LIMIT = "STOP_LOSS_LIMIT",
    TAKE_PROFIT = "TAKE_PROFIT",
    TAKE_PROFIT_LIMIT = "TAKE_PROFIT_LIMIT",
    LIMIT_MAKER = "LIMIT_MAKER"
}

export type BinanceSymbolFilterType =
        | 'PRICE_FILTER'
        | 'LOT_SIZE'
        | 'MIN_NOTIONAL'
        | 'MAX_NUM_ORDERS'
        | 'ICEBERG_PARTS'
        | 'MAX_NUM_ALGO_ORDERS'
        | 'PERCENT_PRICE';


export enum BinanceSymbolStatus
{
    PRE_TRADING = "PRE_TRADING",
    TRADING = "TRADING",
    POST_TRADING = "POST_TRADING",
    END_OF_DAY = "END_OF_DAY",
    HALT = "HALT",
    AUCTION_MATCH = "AUCTION_MATCH",
    BREAK = "BREAK"
}

export interface IBinanceSymbolFilter {
    filterType: BinanceSymbolFilterType,
}

export interface ISymbolPriceFilter extends IBinanceSymbolFilter {
    filterType: 'PRICE_FILTER',
    minPrice: string;
    maxPrice: string;
    tickSize: string;
}

export interface ISymbolLotSizeFilter extends IBinanceSymbolFilter {
    filterType: 'LOT_SIZE',
    minQty: string;
    maxQty: string;
    stepSize: string;
}

export interface ISymbolMinNotionalFilter extends IBinanceSymbolFilter {
    filterType: 'MIN_NOTIONAL';
    minNotional: string;
}

export interface ISymbolMaxNumOrdersFilter extends IBinanceSymbolFilter {
    filterType: 'MAX_NUM_ORDERS';
    limit: number;
}

export interface ISymbolMaxAlgoOrdersFilter extends IBinanceSymbolFilter {
    filterType: 'MAX_NUM_ALGO_ORDERS';
    maxNumAlgoOrders: number;
}

export interface ISymbolIsebergPartsFilter extends IBinanceSymbolFilter {
    filterType: 'ICEBERG_PARTS';
    limit: number;
}

export interface IPercentPriceFilter extends IBinanceSymbolFilter {
    filterType: 'PERCENT_PRICE';
    multiplierUp: string;
    multiplierDown: string;
    avgPriceMins: number;
}

export interface IBinanceSymbol {
    symbol: string;
    status: BinanceSymbolStatus;
    baseAsset: string;
    baseAssetPrecision: number;
    quoteAsset: string;
    quotePrecision: number;
    orderTypes: BinanceOrderType[];
    icebergAllowed: boolean;
    filters: IBinanceSymbolFilter[];
}

export interface IBinanceExchangeInfo {
    // not fully implemented
	timezone: string;
	serverTime: number;
	rateLimits: any[];
	exchangeFilters: any[];
	symbols: IBinanceSymbol[];
}