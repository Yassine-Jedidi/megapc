import { useState, useEffect } from 'react'
import { TrendingUp } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import type { Product } from '@/types'

interface PriceHistoryChartProps {
  product: Product;
}

interface ChartDataPoint {
  date: string;
  fullDate: string;
  price: number;
  isIntermediate?: boolean;
}

export function PriceHistoryChart({ product }: PriceHistoryChartProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!product.priceHistory || product.priceHistory.length < 2) return null

  // Process data to show price changes clearly
  const rawData = product.priceHistory.map(h => ({
    date: new Date(h.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
    fullDate: new Date(h.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
    price: h.price,
    timestamp: new Date(h.createdAt).getTime()
  }));

  // Visual trick: If we have few points, we generate intermediate points to create a "S-curve" look
  const data: ChartDataPoint[] = [];
  if (rawData.length >= 2) {
    for (let i = 0; i < rawData.length - 1; i++) {
      const p1 = rawData[i];
      const p2 = rawData[i + 1];

      // Add start point
      data.push(p1);

      // Add 10 intermediate points for a smooth S-curve
      for (let j = 1; j < 10; j++) {
        const t = j / 10;
        // Cubic easing for the "S" shape (Ease In Out)
        const sqt = t * t;
        const ease = sqt / (2.0 * (sqt - t) + 1.0);

        data.push({
          date: '', // Hide labels for intermediate points
          fullDate: p2.fullDate,
          price: p1.price + (p2.price - p1.price) * ease,
          isIntermediate: true
        });
      }
    }
    // Add final point
    data.push(rawData[rawData.length - 1]);
  }

  const prices = rawData.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice;
  const padding = range === 0 ? minPrice * 0.1 : range * 0.2;

  return (
    <div className="mt-8 mb-4 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">Historique des prix</h3>
          <p className="text-[9px] text-muted-foreground/50 font-bold uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="h-3 w-3 text-primary" /> Evolution du tarif TTC
          </p>
        </div>
      </div>
      <div className="h-[240px] w-full bg-black/20 rounded-3xl p-6 ring-1 ring-white/5 relative overflow-hidden group">
        <div className="absolute inset-0 bg-linear-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {mounted && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={(props: { x?: number | string, y?: number | string, payload?: { value: string } }) => {
                  const { x, y, payload } = props;
                  if (!payload?.value) return <path />;
                  return (
                    <text x={x} y={Number(y) + 15} fill="rgba(255,255,255,0.25)" fontSize={9} fontWeight={700} textAnchor="middle">
                      {payload.value}
                    </text>
                  );
                }}
              />
              <YAxis
                domain={[minPrice - padding, maxPrice + padding]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 8, fontWeight: 700 }}
                tickFormatter={(val) => `${Math.round(val)}`}
                allowDecimals={false}
                tickCount={5}
              />
              <Tooltip
                cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const pointData = payload[0].payload as ChartDataPoint;
                    if (pointData.isIntermediate) return null; // Don't show tooltip for fake points

                    return (
                      <div className="bg-background/95 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl ring-1 ring-black/50">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">{pointData.fullDate}</p>
                        <p className="text-sm font-black text-primary tracking-tight">
                          {Math.round(pointData.price).toLocaleString()} <span className="text-[10px] opacity-70">TND</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="var(--color-primary)"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorPrice)"
                animationDuration={1500}
                dot={(props: { cx?: number, cy?: number, payload?: ChartDataPoint }) => {
                  if (!props.payload || props.payload.isIntermediate) return <path />;
                  return <circle cx={props.cx} cy={props.cy} r={4} fill="var(--color-background)" stroke="var(--color-primary)" strokeWidth={2} />;
                }}
                activeDot={(props: { cx?: number, cy?: number, payload?: ChartDataPoint }) => {
                  if (!props.payload || props.payload.isIntermediate) return <path />;
                  return <circle cx={props.cx} cy={props.cy} r={6} fill="var(--color-primary)" stroke="var(--color-background)" strokeWidth={3} />;
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
