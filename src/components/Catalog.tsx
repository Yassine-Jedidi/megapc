import { Plus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import type { Product } from '@/types'

interface CatalogProps {
  products: Product[];
  loading: boolean;
  total: number;
  selectedCategoryName: string | undefined;
  sortBy: string;
  setSortBy: (val: string) => void;
  onClearAll: () => void;
  showClearAll: boolean;
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  getPages: () => (number | string)[];
  addToCart: (product: Product) => void;
}

export function Catalog({
  products,
  loading,
  total,
  selectedCategoryName,
  sortBy,
  setSortBy,
  onClearAll,
  showClearAll,
  page,
  setPage,
  totalPages,
  getPages,
  addToCart
}: CatalogProps) {
  const navigate = useNavigate();

  return (
    <main className="flex-1 bg-muted/5">
      <div className="py-8 pl-8 px-2">
        <div className="flex flex-col space-y-8">
          {/* Active Filter Bar */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
                {selectedCategoryName || 'Actualités & Nouveautés'}
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Affichage de <span className="text-foreground font-bold">{total}</span> produits disponibles
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Select value={sortBy} onValueChange={(val) => setSortBy(val || 'newest')}>
                <SelectTrigger className="w-[180px] h-9 rounded-xl border-none bg-background ring-1 ring-white/5 font-bold text-[11px] uppercase tracking-wider">
                  {sortBy === 'newest' && 'Nouveautés'}
                  {sortBy === 'popular' && 'Plus populaires'}
                  {sortBy === 'price-asc' && 'Prix croissant'}
                  {sortBy === 'price-desc' && 'Prix décroissant'}
                </SelectTrigger>
                <SelectContent sideOffset={8} alignItemWithTrigger={false} className="rounded-xl border-white/10 bg-background/95 backdrop-blur-md">
                  <SelectItem value="newest" className="text-xs font-bold uppercase tracking-wide">Nouveautés</SelectItem>
                  <SelectItem value="popular" className="text-xs font-bold uppercase tracking-wide">Plus populaires</SelectItem>
                  <SelectItem value="price-asc" className="text-xs font-bold uppercase tracking-wide">Prix croissant</SelectItem>
                  <SelectItem value="price-desc" className="text-xs font-bold uppercase tracking-wide">Prix décroissant</SelectItem>
                </SelectContent>
              </Select>

              {showClearAll && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearAll}
                  className="text-[10px] font-bold uppercase gap-2 hover:text-red-500 h-9"
                >
                  <X className="h-3 w-3" /> Effacer les filtres
                </Button>
              )}
            </div>
          </div>

          {/* Grid Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {loading && products.length === 0 ? (
              Array(12).fill(0).map((_, i) => (
                <Card key={i} className="overflow-hidden border-none bg-card ring-1 ring-white/5 flex flex-col h-full">
                  <div className="p-3">
                    <Skeleton className="aspect-square rounded-2xl bg-muted/20" />
                  </div>
                  <CardContent className="p-6 flex flex-col space-y-4 flex-1">
                    <Skeleton className="h-2.5 w-1/3 bg-muted/20" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full bg-muted/20" />
                      <Skeleton className="h-4 w-2/3 bg-muted/20" />
                    </div>
                    <div className="flex items-center justify-between pt-4 mt-auto">
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-16 bg-muted/20" />
                        <Skeleton className="h-6 w-24 bg-muted/20" />
                      </div>
                      <Skeleton className="h-10 w-10 rounded-2xl bg-muted/20" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              products.map((product) => (
                <Card
                  key={product.id}
                  className="group overflow-hidden border-none bg-card hover:bg-muted/30 transition-all duration-300 ring-1 ring-white/5 hover:ring-primary/30 flex flex-col cursor-pointer"
                  onClick={() => {
                    sessionStorage.setItem('catalog-scroll', window.scrollY.toString());
                    navigate('/produit/' + product.slug);
                  }}
                >
                  <div className="relative p-3">
                    <div className="relative aspect-square overflow-hidden rounded-2xl bg-black/40 flex items-center justify-center p-0">
                      {product.onSale && (
                        <Badge className="absolute top-4 left-4 bg-orange-500 text-black font-black text-[10px] uppercase shadow-xl z-10">
                          PROMO
                        </Badge>
                      )}
                      <img
                        src={product.images[0] ? `/api/images${product.images[0]}?w=384&q=75` : ''}
                        alt={product.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-contain brightness-110"
                      />
                    </div>
                  </div>

                  <CardContent className="p-6 flex flex-col space-y-4 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">
                        {product.category?.name || 'Composant'}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold leading-relaxed line-clamp-2 min-h-12 text-foreground/90 group-hover:text-primary transition-colors cursor-pointer">
                      {product.title}
                    </h3>

                    <div className="flex items-center justify-between pt-4 mt-auto">
                      <div className="flex flex-col">
                        {product.salePrice && product.salePrice < product.price ? (
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[13px] text-muted-foreground/50 line-through font-bold">
                                {product.price.toLocaleString()} TND
                              </span>
                              <span className="text-[10px] bg-orange-500/10 text-orange-500 px-1.5 py-0.5 rounded-md font-black">
                                -{Math.round((1 - product.salePrice / product.price) * 100)}%
                              </span>
                            </div>
                            <span className="text-xl font-black text-primary tracking-tight">
                              {product.salePrice.toLocaleString()} <span className="text-[11px] font-bold opacity-70">TND</span>
                            </span>
                          </div>
                        ) : (
                          <span className="text-xl font-black text-foreground tracking-tight">
                            {product.price.toLocaleString()} <span className="text-[11px] font-bold opacity-70">TND</span>
                          </span>
                        )}
                      </div>

                      <Button
                        size="icon"
                        className="h-10 w-10 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-110 hover:shadow-primary/40 active:scale-95 border-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                      >
                        <Plus className="h-5 w-5 stroke-[2.5px]" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Pagination Section */}
          {totalPages > 1 && (
            <div className="pt-10 pb-20">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => { e.preventDefault(); if (page > 1) setPage(page - 1); }}
                      className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {getPages().map((p, i) => (
                    <PaginationItem key={i}>
                      {p === 'ellipsis' ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          href="#"
                          isActive={page === p}
                          onClick={(e) => { e.preventDefault(); setPage(p as number); }}
                          className="cursor-pointer"
                        >
                          {p}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => { e.preventDefault(); if (page < totalPages) setPage(page + 1); }}
                      className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
