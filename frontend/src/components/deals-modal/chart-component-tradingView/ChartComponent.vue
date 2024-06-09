<template>
    <div ref="chartContainer" />
</template>

<script lang="ts">
import { Options, Vue } from 'vue-class-component';
import { TradingViewDataFeed } from './tradingViewDataFeed';
import { TradingViewDealsDisplay } from './tradingViewDealDisplay';
import { ICalculatedResult } from '../../calculate';
import {
    ChartingLibraryWidgetOptions,
    IChartingLibraryWidget,
    ResolutionString,
    widget, Timezone
} from '../../../assets/charting_library';

@Options({
    props: {
        currentResult: Object,
        item: Object,
    },
})
export default class DealsModal extends Vue {
    declare currentResult: ICalculatedResult;
    declare item: any;

    _tvWidget: IChartingLibraryWidget | undefined;
    _dialsDisplay: TradingViewDealsDisplay;

    initChart() {
        const dataFeed = new TradingViewDataFeed(this.currentResult);

        const widgetOptions: ChartingLibraryWidgetOptions = {
            symbol: `${this.currentResult.exchange}:${this.currentResult.symbol}`,
            interval: '60' as ResolutionString, // TimeFrameToTVResolution[this.currentResult.timeFrame] as ResolutionString,
            autosize: true,
            //fullscreen: true,
            container: this.$refs.chartContainer as HTMLElement,
            library_path: 'charting_library/',
            locale: 'en',
            datafeed: dataFeed,
            theme: 'dark',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone as Timezone
        };

        const tvWidget = new widget(widgetOptions);
        this._tvWidget = tvWidget;

        this._dialsDisplay = new TradingViewDealsDisplay(tvWidget, this.item, dataFeed);
    }

    destroyChart() {
        this._tvWidget.remove();
        this._dialsDisplay.destroy();
    }
}
</script>
