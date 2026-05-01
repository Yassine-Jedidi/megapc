import { Filter, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

import type { Category } from '@/types'
import { StatusFilters } from './sidebar/StatusFilters'
import { BudgetFilter } from './sidebar/BudgetFilter'
import { CategoryNav } from './sidebar/CategoryNav'
import { SpecFilters } from './sidebar/SpecFilters'

interface SidebarProps {
  sidebarOpen: boolean;
  categories: Category[];
  subCategories: Category[];
  selectedCategory: string | null;
  setSelectedCategory: (id: string | null) => void;
  selectedSubCategory: string | null;
  setSelectedSubCategory: (id: string | null) => void;
  fetchSubCategories: (catId: string) => void;
  setSubCategories: (subs: Category[]) => void;
  inStock: boolean;
  setInStock: (val: boolean) => void;
  onSale: boolean;
  setOnSale: (val: boolean) => void;
  isNew: boolean;
  setIsNew: (val: boolean) => void;
  isArriving: boolean;
  setIsArriving: (val: boolean) => void;
  commande48H: boolean;
  setCommande48H: (val: boolean) => void;
  quoteMode: boolean;
  setQuoteMode: (val: boolean) => void;
  checkStock: boolean;
  setCheckStock: (val: boolean) => void;
  isPrivate: boolean;
  setIsPrivate: (val: boolean) => void;
  hasHistory: boolean;
  setHasHistory: (val: boolean) => void;
  priceRange: number[];
  setPriceRange: (range: number[]) => void;
  absoluteMaxPrice: number;
  search: string;
  sortBy: string;
  onClearAll: () => void;
  selectedCpu: string | null;
  setSelectedCpu: (val: string | null) => void;
  selectedGpu: string | null;
  setSelectedGpu: (val: string | null) => void;
  availableCpus: string[];
  availableGpus: string[];
  priceTrend: string | null;
  setPriceTrend: (val: string | null) => void;
}

export function Sidebar({
  sidebarOpen, categories, subCategories, selectedCategory, setSelectedCategory,
  selectedSubCategory, setSelectedSubCategory, fetchSubCategories, setSubCategories,
  inStock, setInStock, onSale, setOnSale, isNew, setIsNew, isArriving, setIsArriving,
  commande48H, setCommande48H, quoteMode, setQuoteMode, checkStock, setCheckStock,
  isPrivate, setIsPrivate, hasHistory, setHasHistory, priceRange, setPriceRange, absoluteMaxPrice, search,
  sortBy, onClearAll,
  selectedCpu, setSelectedCpu, selectedGpu, setSelectedGpu, availableCpus, availableGpus,
  priceTrend, setPriceTrend
}: SidebarProps) {
  const isFiltered = selectedCategory || selectedSubCategory || search || onSale || 
                    isNew || !inStock || isArriving || commande48H || quoteMode || 
                    checkStock || isPrivate || hasHistory || priceRange[0] !== 0 || 
                    priceRange[1] !== absoluteMaxPrice || sortBy !== 'newest' ||
                    selectedCpu || selectedGpu || priceTrend

  return (
    <aside className={`${sidebarOpen ? 'w-72' : 'w-0'} sticky top-16 h-[calc(100vh-4rem)] border-r bg-muted/5 transition-all duration-300 hidden lg:block overflow-hidden`}>
      <ScrollArea className="h-full p-6">
        <div className="flex flex-col space-y-6">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-2">
              <Filter className="h-3 w-3" /> Navigation
            </h3>
            <div className="flex flex-col gap-1">
              <Button
                variant={!selectedCategory ? "secondary" : "ghost"}
                className="justify-between h-10 px-3 font-bold text-xs rounded-xl group"
                onClick={() => setSelectedCategory(null)}
              >
                Toute la boutique
                <span className="text-[10px] opacity-50 font-normal">All</span>
              </Button>
            </div>
          </div>

          <Separator className="opacity-20" />

          <StatusFilters
            inStock={inStock} setInStock={setInStock}
            onSale={onSale} setOnSale={setOnSale}
            isNew={isNew} setIsNew={setIsNew}
            isArriving={isArriving} setIsArriving={setIsArriving}
            commande48H={commande48H} setCommande48H={setCommande48H}
            quoteMode={quoteMode} setQuoteMode={setQuoteMode}
            checkStock={checkStock} setCheckStock={setCheckStock}
            isPrivate={isPrivate} setIsPrivate={setIsPrivate}
            hasHistory={hasHistory} setHasHistory={setHasHistory}
            priceTrend={priceTrend} setPriceTrend={setPriceTrend}
          />

          <div className="flex flex-col gap-6">
            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="text-[10px] font-bold uppercase gap-2 hover:text-red-500 w-fit p-0 h-auto"
              >
                <X className="h-3 w-3" /> Effacer tout
              </Button>
            )}

            <BudgetFilter
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              absoluteMaxPrice={absoluteMaxPrice}
            />

            <Separator className="opacity-20" />

            <SpecFilters
              selectedCpu={selectedCpu}
              setSelectedCpu={setSelectedCpu}
              selectedGpu={selectedGpu}
              setSelectedGpu={setSelectedGpu}
              availableCpus={availableCpus}
              availableGpus={availableGpus}
            />

            <Separator className="opacity-20" />

            <CategoryNav
              categories={categories}
              subCategories={subCategories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedSubCategory={selectedSubCategory}
              setSelectedSubCategory={setSelectedSubCategory}
              fetchSubCategories={fetchSubCategories}
              setSubCategories={setSubCategories}
            />
          </div>
        </div>
      </ScrollArea>
    </aside>
  )
}
