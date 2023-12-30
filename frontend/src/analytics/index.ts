// @ts-nocheck
export function initAnalytics(analyticsId: string) {
    // eslint-disable-next-line no-unused-expressions
    !(function () {
        window.dataLayer = window.dataLayer || [];

        function gtag() {
            // eslint-disable-next-line prefer-rest-params
            dataLayer.push(arguments);
        }

        window.gtag = gtag;
        gtag('js', new Date());
        gtag('config', analyticsId);
    }());
    if (analyticsId) {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsId}`;
        document.getElementsByTagName('head')[0].appendChild(script);
    }
}
