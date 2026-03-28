'use client';

import { StockQuote } from '@/types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface StockTickerProps {
  stocks: StockQuote[];
}

export default function StockTicker({ stocks }: StockTickerProps) {
  if (stocks.length === 0) {
    return (
      <div className="h-12 bg-c2-panel border-t border-c2-border flex items-center justify-center">
        <span className="text-c2-muted text-xs font-mono">AWAITING MARKET DATA...</span>
      </div>
    );
  }

  return (
    <div className="h-14 bg-c2-panel border-t border-c2-border flex items-center px-4 gap-4 shrink-0">
      <span className="text-[10px] text-c2-muted tracking-widest shrink-0">MARKETS</span>
      <div className="flex-1 flex items-center gap-3 overflow-x-auto">
        {stocks.map((stock) => (
          <StockCard key={stock.symbol} stock={stock} />
        ))}
      </div>
    </div>
  );
}

function StockCard({ stock }: { stock: StockQuote }) {
  const isUp = stock.changePct > 0;
  const isDown = stock.changePct < 0;
  const isFlat = stock.changePct === 0;

  const changeColor = isUp ? 'text-green-500' : isDown ? 'text-red-500' : 'text-c2-muted';
  const sparkColor = isUp ? '#22c55e' : isDown ? '#ef4444' : '#64748b';

  const sparkData = stock.sparkline.map((price, i) => ({ v: price }));

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 rounded border border-c2-border bg-c2-bg/50 min-w-[200px]">
      <div className="flex flex-col min-w-[80px]">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-c2-text">{stock.symbol}</span>
          <span className="text-[9px] text-c2-muted">{stock.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-c2-text">${stock.price.toFixed(2)}</span>
          <div className={`flex items-center gap-0.5 ${changeColor}`}>
            {isUp && <TrendingUp className="w-3 h-3" />}
            {isDown && <TrendingDown className="w-3 h-3" />}
            {isFlat && <Minus className="w-3 h-3" />}
            <span className="text-[10px] font-mono">
              {isUp ? '+' : ''}{stock.changePct.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
      {sparkData.length > 1 && (
        <div className="w-16 h-8">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={sparkColor}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
