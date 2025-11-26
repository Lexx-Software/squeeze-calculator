import { Vue } from 'vue-class-component';
import { SqueezeBindings } from 'squeeze-utils';

export default class BrowserLinks extends Vue {
    declare calcForm: any;

    // CREATE STRATEGY LINK

    createStrategyLink(data) {
        // check and add sub domain (used for testing)
        const cookiesObj = this.getCookiesObj();
        const subDomain = cookiesObj.subDomain ? `${cookiesObj.subDomain}.`: '';

        (window as any).gtag('event', "on_create_strategy", {
            exchange: data.exchange,
            symbol: data.symbol,
            timeframe: data.timeFrame
        });

        let link = `https://${subDomain}lexx-trade.com/strategy?utm_source=squeeze_calculator#t=s&s=${data.exchange}:${data.symbol.replace('-', '')}&tu=1`;
        // time frame
        link += `&tf=${data.timeFrame}`;
        // binding
        link += `&bi=${this.getBindingForLink(data.binding)}`;
        // buy/sell trigger
        link += `&bt=${data.percentEnter}&st=${data.percentExit}`;
        // Once per candle
        link += `&oc=${data.oncePerCandle ? 1 : 0}`;
        // direction
        link += `&d=${data.isShort ? 's' : 'l'}`;
        // sl time
        if (data.stopLossTime) {
            link += `&slt=1&sltv=${data.stopLossTime}`;
        }
        // sl perc
        if (data.stopLossPercent) {
            link += `&sl=${data.stopLossPercent}`;
        }
        // Stop on closing one-min candle
        if (data.stopOnKlineClosed) {
            link += '&slc=1';
        }
        link += '&src=squeeze_calculator';

        window.open(link, '_blank');
    }

    getCookiesObj() {
        const cookiesObj: any = document.cookie.split('; ').reduce((prev, current) => {
            const [name, ...value] = current.split('=');
            prev[name] = value.join('=');
            return prev;
        }, {});
        return cookiesObj;
    }

    getBindingForLink(value) {
        switch (value) {
            case SqueezeBindings.LOW: return 'l';
            case SqueezeBindings.HIGH: return 'h';
            case SqueezeBindings.OPEN: return 'o';
            case SqueezeBindings.CLOSE: return 'c';
            case SqueezeBindings.HL2: return 'hl2';
            case SqueezeBindings.OC2: return 'oc2';
            case SqueezeBindings.OHLC4: return 'ohlc';
            case SqueezeBindings.HLC3: return 'hlc';
            default: return undefined;
        }
    }

    // GET & APPLY LINK DATA

    checkLink() {
        const linkData = window.location.search.replace('?', '');
        const dataArr = linkData.split('&');
        const dataObj: any = {};
        for (const item of dataArr) {
            const itemArr = item.split('=');
            dataObj[itemArr[0]] = itemArr[1];
        }
        if (dataObj.s) {
            const arr = dataObj.s.split(':');
            this.calcForm.exchange = arr[0];
            this.calcForm.symbol = arr[1];
        }
        if (dataObj.tf) {
            this.calcForm.timeframe = this.getTimeFrame(dataObj.tf);
        }
    }

    getTimeFrame(minutes) {
        switch (Number(minutes)) {
            case 1: return 'lm';
            case 3: return '3m';
            case 5: return '5m';
            case 15: return '15m';
            case 30: return '30m';
            case 60: return '1h';
            case 120: return '2h';
            case 240: return '4h';
            case 360: return '6h';
            case 480: return '8h';
            case 720: return '12h';
            case 1440: return '1d';
            default: return '1d';
        }
    }
}
