import { ISqueezeDealsStatistic } from 'squeeze-utils';
import { EntityId, IChartingLibraryWidget } from '../../../assets/charting_library';
import { TradingViewDataFeed } from './tradingViewDataFeed';

export class TradingViewDealsDisplay {
    constructor(private _widget: IChartingLibraryWidget, private _deals: ISqueezeDealsStatistic, private _dataFeed: TradingViewDataFeed) {
        _widget.onChartReady(this._onChartReady.bind(this));
    }

    private _onChartReady() {
        this._widget.activeChart().onDataLoaded().subscribe(null, this._onDataLoaded.bind(this));
        this._widget.activeChart().onIntervalChanged().subscribe(null, this._onIntervalChanged.bind(this));
        this._widget.activeChart().onVisibleRangeChanged().subscribe(null, this._onVisibleRangeChanged.bind(this));
        this._recheckDisplayTrades();
    }

    private _createShape(time: number, price: number, isBuy: boolean, isStopLoss: boolean = false): EntityId | null {
        return this._widget.activeChart().createMultipointShape([{
            time: Math.round(time / 1000),
            price: price
        }], {
            shape: 'icon',
            lock: true,
            disableSelection: true,
            disableUndo: true,
            disableSave: true,
            zOrder: 'top',
            overrides: {
                color: isStopLoss ? '#FF0000' : (isBuy ? '#00FF00' : '#FFFF00'),
                icon: 0xf0d8,
                size: 15,
                angle: isBuy ? 1.570795 : -1.570795
            }
        });
    }

    private _recheckDisplayTrades() {
        if (!this._dataFeed.lastLoadedDataHistoryTime) {
            return;
        }

        const range = this._widget.activeChart().getVisibleRange();
        const visibleRangeStart = Math.max(this._dataFeed.lastLoadedDataHistoryTime, range.from * 1000);

        for (const deal of this._deals.deals) {
            const dealAny = deal as any;
            if (dealAny._enterEntityId) {
                break;
            }

            if (visibleRangeStart <= deal.timeEnter) {
                dealAny._enterEntityId = this._createShape(deal.timeEnter, deal.priceEnter, !this._deals.settings.isShort);
            }

            if (!dealAny._exitEntityId && visibleRangeStart <= deal.timeExit) {
                dealAny._exitEntityId = this._createShape(deal.timeExit, deal.priceExit, this._deals.settings.isShort, deal.isPercentStopLoss || deal.isTimeStopLoss);
            }
        }
    }

    _onIntervalChanged() {
        this._removeDisplayedTrades();
    }

    _onVisibleRangeChanged() {
        this._recheckDisplayTrades();
    }

    _removeDisplayedTrades() {
        const chart = this._widget.activeChart();
        for (const deal of this._deals.deals) {
            const dealAny = deal as any;
            if (dealAny._enterEntityId) {
                chart.removeEntity(dealAny._enterEntityId);
                dealAny._enterEntityId = undefined;
            }
            if (dealAny._exitEntityId) {
                chart.removeEntity(dealAny._exitEntityId);
                dealAny._exitEntityId = undefined;
            }
        }
    }

    _onDataLoaded() {
        this._recheckDisplayTrades();
    }

    destroy() {
        for (const deal of this._deals.deals) {
            const dealAny = deal as any;
            if (dealAny._enterEntityId) {
                dealAny._enterEntityId = undefined;
            }
            if (dealAny._exitEntityId) {
                dealAny._exitEntityId = undefined;
            }
        }
        this._deals = undefined;
        this._dataFeed = undefined;
    }
}