import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"

interface BudgetFilterProps {
  priceRange: number[];
  setPriceRange: (range: number[]) => void;
  absoluteMaxPrice: number;
}

export function BudgetFilter({ priceRange, setPriceRange, absoluteMaxPrice }: BudgetFilterProps) {
  return (
    <div>
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/50 mb-4">Budget</h3>
      <div className="flex flex-col gap-5 px-1">
        <div className="flex justify-between items-center gap-3">
          <div className="relative flex-1">
            <Input
              type="number"
              value={priceRange[0]}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0
                if (val <= priceRange[1]) {
                  setPriceRange([val, priceRange[1]])
                }
              }}
              className="h-8 pl-2 pr-7 text-[9px] font-bold bg-muted/30 border-none ring-1 ring-white/5 focus-visible:ring-primary/20 rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-bold text-muted-foreground/40">TND</span>
          </div>
          <span className="text-muted-foreground/30">—</span>
          <div className="relative flex-1">
            <Input
              type="number"
              value={priceRange[1]}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0
                if (val >= priceRange[0] && val <= absoluteMaxPrice) {
                  setPriceRange([priceRange[0], val])
                }
              }}
              className="h-8 pl-2 pr-7 text-[9px] font-bold bg-muted/30 border-none ring-1 ring-white/5 focus-visible:ring-primary/20 rounded-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-bold text-muted-foreground/40">TND</span>
          </div>
        </div>
        <Slider
          value={priceRange}
          max={absoluteMaxPrice}
          step={100}
          onValueChange={(val) => {
            if (Array.isArray(val)) setPriceRange(val)
          }}
          className="cursor-pointer"
        />
        <p className="text-[9px] text-muted-foreground/40 text-center uppercase font-bold tracking-widest leading-loose">
          Ajustez le prix
        </p>
      </div>
    </div>
  )
}
