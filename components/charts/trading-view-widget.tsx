'use client';

import useTradingViewWidget from '@/hooks/useTradingViewWidget';
import { cn } from '@/lib/utils';
import { memo } from 'react';

type TradingViewWidgetProps = {
  scriptUrl: string;
  config: Record<string, unknown>;
  height?: number;
  title?: string;
  className?: string;
};

function TradingViewWidget({
  scriptUrl,
  config,
  height = 600,
  title,
  className,
}: TradingViewWidgetProps) {
  const containerRef = useTradingViewWidget(scriptUrl, config, height);

  return (
    <div className='w-full'>
      {title && (
        <h2 className='mb-4 text-2xl text-gray-100 font-semibold'>{title}</h2>
      )}
      <div
        className={cn('tradingview-widget-container', className)}
        ref={containerRef}
      >
        <div
          className='tradingview-widget-container__widget'
          style={{ height: height, width: '100%' }}
        />
      </div>
    </div>
  );
}

export default memo(TradingViewWidget);
