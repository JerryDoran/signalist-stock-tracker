import TradingViewWidget from '@/components/charts/trading-view-widget';
import { MARKET_OVERVIEW_WIDGET_CONFIG } from '@/lib/constants';

export default function HomePage() {
  return (
    <div className='flex home-wrapper min-h-screen'>
      <section className='grid w-full gap-8 home-section'>
        <div className='md:col-span-1 xl:col-span-1'>
          <TradingViewWidget
            title='Market Overview'
            scriptUrl='https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js'
            config={MARKET_OVERVIEW_WIDGET_CONFIG}
            className='custom-chart'
          />
        </div>
      </section>
    </div>
  );
}
