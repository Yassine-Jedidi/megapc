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

export function PriceHistoryChart({ product }: PriceHistoryChartProps) {
  if (!product.priceHistory || product.priceHistory.length === 0) return null

  return (
    <div className="mt-12 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Historique des prix</h3>
          <p className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-widest flex items-center gap-2">
             <TrendingUp className="h-3 w-3" /> Evolution du tarif TTC
          </p>
        </div>
      </div>
      <div className="h-[200px] w-full bg-muted/10 rounded-2xl p-4 ring-1 ring-white/5">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={product.priceHistory.map(h => ({
            date: new Date(h.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
            price: h.price
          }))}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 800 }}
              dy={10}
            />
            <YAxis 
              hide 
              domain={['dataMin - 100', 'dataMax + 100']} 
            />
            <Tooltip 
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => value ? [`${Number(value).toLocaleString()} TND`, "Prix"] : ["-", "Prix"]}
              contentStyle={{ 
                backgroundColor: 'rgba(20,20,20,0.95)', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 'bold',
                backdropFilter: 'blur(10px)'
              }}
              itemStyle={{ color: 'hsl(var(--primary))' }}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2.5}
              fillOpacity={1} 
              fill="url(#colorPrice)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
