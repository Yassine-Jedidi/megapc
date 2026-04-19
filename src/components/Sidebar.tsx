import { Filter, Box, Zap, Rocket, Truck, Timer, FileText, ShieldCheck, Lock, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

import type { Category } from '@/types'

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
  priceRange: number[];
  setPriceRange: (range: number[]) => void;
  absoluteMaxPrice: number;
  search: string;
  sortBy: string;
  onClearAll: () => void;
}

export function Sidebar({
  sidebarOpen,
  categories,
  subCategories,
  selectedCategory,
  setSelectedCategory,
  selectedSubCategory,
  setSelectedSubCategory,
  fetchSubCategories,
  setSubCategories,
  inStock,
  setInStock,
  onSale,
  setOnSale,
  isNew,
  setIsNew,
  isArriving,
  setIsArriving,
  commande48H,
  setCommande48H,
  quoteMode,
  setQuoteMode,
  checkStock,
  setCheckStock,
  isPrivate,
  setIsPrivate,
  priceRange,
  setPriceRange,
  absoluteMaxPrice,
  search,
  sortBy,
  onClearAll
}: SidebarProps) {
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

          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Statut</h3>
            <div className="flex flex-col gap-4 px-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="in-stock" className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                  <Box className="h-3 w-3 text-green-500" /> EN STOCK
                </Label>
                <Switch id="in-stock" checked={inStock} onCheckedChange={setInStock} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="on-sale" className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                  <Zap className="h-3 w-3 text-orange-500" /> PROMO
                </Label>
                <Switch id="on-sale" checked={onSale} onCheckedChange={setOnSale} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is-new" className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                  <Rocket className="h-3 w-3 text-blue-400 font-bold" /> NOUVEAUTÉ
                </Label>
                <Switch id="is-new" checked={isNew} onCheckedChange={setIsNew} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is-arriving" className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                  <Truck className="h-3 w-3 text-purple-400" /> EN ARRIVAGE
                </Label>
                <Switch id="is-arriving" checked={isArriving} onCheckedChange={setIsArriving} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="commande-48h" className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                  <Timer className="h-3 w-3 text-emerald-400" /> LIVRAISON 48H
                </Label>
                <Switch id="commande-48h" checked={commande48H} onCheckedChange={setCommande48H} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="quote-mode" className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                  <FileText className="h-3 w-3 text-sky-400" /> SUR DEVIS
                </Label>
                <Switch id="quote-mode" checked={quoteMode} onCheckedChange={setQuoteMode} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="check-stock" className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="h-3 w-3 text-indigo-400" /> STOCK GARANTI
                </Label>
                <Switch id="check-stock" checked={checkStock} onCheckedChange={setCheckStock} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is-private" className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                  <Lock className="h-3 w-3 text-rose-500" /> VENTES PRIVÉES
                </Label>
                <Switch id="is-private" checked={isPrivate} onCheckedChange={setIsPrivate} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {(selectedCategory || selectedSubCategory || search || onSale || isNew || !inStock || isArriving || commande48H || quoteMode || checkStock || isPrivate || priceRange[0] !== 0 || priceRange[1] !== absoluteMaxPrice || sortBy !== 'newest') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="text-[10px] font-bold uppercase gap-2 hover:text-red-500 w-fit p-0 h-auto"
              >
                <X className="h-3 w-3" /> Effacer tout
              </Button>
            )}

            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Budget</h3>
              <div className="flex flex-col gap-5 px-1">
                <div className="flex justify-between items-center text-[10px] font-black tracking-wider uppercase">
                  <span className="text-primary">{priceRange[0].toLocaleString()} TND</span>
                  <span className="text-muted-foreground/50">—</span>
                  <span className="text-primary">
                    {priceRange[1].toLocaleString()} TND
                  </span>
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

            <Separator className="opacity-20" />
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Catégories</h3>
              <div className="flex flex-col gap-1">
                {categories.filter(cat => cat._count.products > 0).map((cat) => (
                  <div key={cat.id} className="flex flex-col">
                    <Button
                      variant={selectedCategory === cat.id ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-between text-[11px] font-bold uppercase tracking-wider h-9 px-3 rounded-xl transition-all duration-300",
                        selectedCategory === cat.id ? "bg-primary/10 text-primary shadow-sm" : "hover:bg-primary/5 text-muted-foreground/80 hover:text-foreground"
                      )}
                      onClick={() => {
                        if (selectedCategory === cat.id) {
                          setSelectedCategory(null);
                          setSelectedSubCategory(null);
                          setSubCategories([]);
                        } else {
                          setSelectedCategory(cat.id);
                          setSelectedSubCategory(null);
                          fetchSubCategories(cat.id);
                        }
                      }}
                    >
                      <span className="flex items-center gap-2">
                        {cat.name}
                      </span>
                      <span className="text-[9px] opacity-40">{cat._count.products}</span>
                    </Button>

                    {selectedCategory === cat.id && subCategories.length > 0 && (
                      <div className="flex flex-col ml-3 mt-1 pl-2 border-l border-primary/10 gap-0.5">
                        {subCategories.map((sub) => (
                          <Button
                            key={sub.id}
                            variant={selectedSubCategory === sub.id ? "secondary" : "ghost"}
                            className={cn(
                              "w-full justify-between text-[10px] font-bold uppercase tracking-wide h-7 px-3 rounded-lg transition-all",
                              selectedSubCategory === sub.id ? "text-primary bg-primary/5 font-black" : "text-muted-foreground/60 hover:text-primary hover:bg-transparent"
                            )}
                            onClick={() => setSelectedSubCategory(selectedSubCategory === sub.id ? null : sub.id)}
                          >
                            <span>{sub.name}</span>
                            <span className="text-[8px] opacity-50">{sub._count?.products || 0}</span>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </aside>
  )
}
