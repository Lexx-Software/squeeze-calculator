import { Vue } from 'vue-class-component';
import i18n from '@/i18n';
import { SqueezeBindings } from 'squeeze-utils';
import { EXCHANGE_TEXT } from '../../enum';
import { ICalculatedResult } from '../calculate';

const { t } = i18n.global;

export default class TableData extends Vue {
    declare calcForm: any;

    // TABLE

    tableData = [];
    isShowTable = false;
    resultsCount = 0;
    resultsText = '';

    setTableData(data: ICalculatedResult) {
        this.isShowTable = true;
        for (const item of data.dataArr || []) {
            this.resultsCount++
            this.tableData.push({
                item: item,
                isShort: item.settings.isShort,
                binding: item.settings.binding,
                percentEnter: item.settings.percentEnter,
                percentExit: item.settings.percentExit,
                stopLossTime: item.settings.stopLossTime ? item.settings.stopLossTime / (60 * 1000) : 0,
                stopLossPercent: item.settings.stopLossPercent,
                timeFrame: item.settings.timeFrame,
                oncePerCandle: item.settings.oncePerCandle,
                totalDeals: item.totalDeals,
                deals: item.deals,
                totalProfitPercent: item.totalProfitPercent ? Number(item.totalProfitPercent.toFixed(2)) : 0,
                coeff: item.coeff ? Number(item.coeff.toFixed(2)) : 0,
                winrate: item.winRate ? Number(item.winRate.toFixed(2)) : 0,
                maxDrawdownPercent: Number(item.maxDrawdownPercent.toFixed(2)),
                maxTimeInDealMins: Number(Math.round(item.maxTimeInDeal / 60000).toFixed(2)),
                symbol: data.symbol,
                exchange: data.exchange,
                stopOnKlineClosed: data.stopOnKlineClosed,
            })
        }
        this.resultsText = `${t('main.results', {
                exchange: EXCHANGE_TEXT[this.calcForm.exchange],
                symbol: this.calcForm.symbol,
                timeframe: this.calcForm.timeframe,
            })} (${this.resultsCount}):`;
    }

    getBindingText(value) {
        switch (value) {
            case SqueezeBindings.LOW: return t('main.low');
            case SqueezeBindings.HIGH: return t('main.high');
            case SqueezeBindings.OPEN: return t('main.open');
            case SqueezeBindings.CLOSE: return t('main.close');
            case SqueezeBindings.HL2: return t('main.hl2');
            case SqueezeBindings.OC2: return t('main.oc2');
            case SqueezeBindings.OHLC4: return t('main.ohlc4');
            case SqueezeBindings.HLC3: return t('main.hlc3');
            default: return '';
        }
    }

    // DEALS MODAL

    isDealsModalVisible = false;
    dealsRow = undefined;

    openDealsModal(row) {
        this.isDealsModalVisible = true;
        this.dealsRow = row;
    }
}
