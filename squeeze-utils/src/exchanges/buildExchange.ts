import { BaseExchange, Exchange } from './baseExchange';
import { BinanceExchange } from './binanceExchange';
import { OkxExchange } from './okxExchange';
import { OkxInstType } from './okxTypes';

export function buildExchange(exchange: Exchange): BaseExchange {
    switch (exchange) {
        case Exchange.BINANCE_FUTURES:
        case Exchange.BINANCE: 
            return new BinanceExchange(exchange);

        case Exchange.OKX: 
            return new OkxExchange(OkxInstType.SPOT);

        case Exchange.OKX_FUTURES: 
            return new OkxExchange(OkxInstType.SWAP);

        default:
            throw new Error('Unsupported exchange')
    }
}