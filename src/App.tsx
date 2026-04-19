import { useState, useEffect, useCallback } from 'react'
import { Search, ShoppingCart, Plus, Filter, LayoutGrid, X, Rocket, Zap, Box, Truck, Timer, FileText, ShieldCheck, Lock } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"

interface Product {
  id: string
  slug: string
  title: string
  price: number
  salePrice: number | null
  onSale: boolean
  isNew: boolean
  stock: number
  images: string[]
  category?: { name: string }
}

interface Category {
  id: string
  name: string
  _count: { products: number }
}

function App() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [subCategories, setSubCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null)
  const [onSale, setOnSale] = useState(false)
  const [isNew, setIsNew] = useState(false)
  const [inStock, setInStock] = useState(false)
  const [isArriving, setIsArriving] = useState(false)
  const [commande48H, setCommande48H] = useState(false)
  const [quoteMode, setQuoteMode] = useState(false)
  const [checkStock, setCheckStock] = useState(false)
  const [isPrivate, setIsPrivate] = useState(false)
  const [absoluteMaxPrice, setAbsoluteMaxPrice] = useState(20000)
  const [priceRange, setPriceRange] = useState([0, 20000])
  const [sortBy, setSortBy] = useState('newest')

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Reset to page 1 when any filter changes
  useEffect(() => {
    setPage(1)
  }, [search, selectedCategory, selectedSubCategory, onSale, isNew, inStock, isArriving, commande48H, quoteMode, checkStock, isPrivate, priceRange, sortBy])

  const getSharedQueryParams = useCallback(() => {
    return {
      search,
      onSale: onSale.toString(),
      isNew: isNew.toString(),
      inStock: inStock.toString(),
      isArriving: isArriving.toString(),
      commande48H: commande48H.toString(),
      quoteMode: quoteMode.toString(),
      checkStock: checkStock.toString(),
      isPrivate: isPrivate.toString(),
      minPrice: priceRange[0].toString(),
      maxPrice: priceRange[1].toString(),
    }
  }, [search, onSale, isNew, inStock, isArriving, commande48H, quoteMode, checkStock, isPrivate, priceRange])

  const fetchCategories = useCallback(async () => {
    try {
      const query = new URLSearchParams(getSharedQueryParams())
      const res = await fetch(`http://localhost:3001/api/categories?${query}`)
      const data = await res.json()
      setCategories(data)
    } catch (e) {
      console.error('Failed to fetch categories', e)
    }
  }, [getSharedQueryParams])

  const fetchSubCategories = useCallback(async (catId: string) => {
    try {
      const query = new URLSearchParams(getSharedQueryParams())
      const res = await fetch(`http://localhost:3001/api/categories/${catId}/sub?${query}`)
      const data = await res.json()
      setSubCategories(data)
    } catch (e) {
      console.error('Failed to fetch sub-categories', e)
    }
  }, [getSharedQueryParams])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '48',
        sortBy,
        ...getSharedQueryParams()
      })
      if (selectedCategory) query.append('categoryId', selectedCategory)
      if (selectedSubCategory) query.append('subCategoryId', selectedSubCategory)

      const res = await fetch(`http://localhost:3001/api/products?${query}`)
      const data = await res.json()
      setProducts(data.products)
      setTotalPages(data.pagination.totalPages)
      setTotal(data.pagination.total)
    } catch (e) {
      console.error('Failed to fetch products', e)
    } finally {
      setLoading(false)
    }
  }, [page, selectedCategory, selectedSubCategory, sortBy, getSharedQueryParams])

  useEffect(() => {
    document.documentElement.classList.add('dark')
    // Fetch absolute max price to globally scale the slider
    fetch('http://localhost:3001/api/products/max-price')
      .then(r => r.json())
      .then(data => {
        setAbsoluteMaxPrice(data.maxPrice)
        setPriceRange([0, data.maxPrice])
      })
      .catch(e => console.error('Failed to get max price:', e))
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCategories()
      if (selectedCategory) {
        fetchSubCategories(selectedCategory)
      }
      fetchProducts()
    }, 400) // Debounce 400ms for smooth sliding
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return () => clearTimeout(timer)
  }, [fetchProducts, fetchCategories, fetchSubCategories, selectedCategory])

  // Simple page calculation for the UI
  const getPages = () => {
    const pages = []
    const startPage = Math.max(1, page - 1)
    const endPage = Math.min(totalPages, page + 1)

    if (startPage > 1) pages.push(1)
    if (startPage > 2) pages.push('ellipsis')

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    if (endPage < totalPages - 1) pages.push('ellipsis')
    if (endPage < totalPages) pages.push(totalPages)

    return pages
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header Section */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between px-0 mx-auto">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:flex ml-4">
              <LayoutGrid className="h-5 w-5" />
            </Button>
            <a href="/" className="flex items-center">
              <img src="https://megapc.tn/_next/image?url=%2Fassets%2Fimages%2Fmega.png&w=640&q=100" alt="Megapc" className="h-6 w-auto brightness-110 translate-y-1" />
            </a>
          </div>

          <div className="flex flex-1 items-center justify-end space-x-6 pr-4">
            <div className="relative w-full max-w-sm lg:max-w-md hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher sur Megapc..."
                className="pl-10 h-10 rounded-xl bg-muted/40 border-none ring-1 ring-white/5 focus-visible:ring-primary/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[8px] bg-primary">0</Badge>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex container mx-auto">
        {/* Left Sidebar Filter */}
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
                    <Label htmlFor="in-stock" className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                      <Box className="h-3 w-3 text-green-500" /> EN STOCK
                    </Label>
                    <Switch id="in-stock" checked={inStock} onCheckedChange={setInStock} />
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
                {(selectedCategory || selectedSubCategory || search || onSale || isNew || inStock || isArriving || commande48H || quoteMode || checkStock || isPrivate || priceRange[0] !== 0 || priceRange[1] !== absoluteMaxPrice || sortBy !== 'newest') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCategory(null);
                      setSelectedSubCategory(null);
                      setSubCategories([]);
                      setSearch('');
                      setOnSale(false);
                      setIsNew(false);
                      setInStock(false);
                      setIsArriving(false);
                      setCommande48H(false);
                      setQuoteMode(false);
                      setCheckStock(false);
                      setIsPrivate(false);
                      setPriceRange([0, absoluteMaxPrice]);
                      setSortBy('newest');
                    }}
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

        {/* Main Product Area */}
        <main className="flex-1 bg-muted/5">
          <div className="py-8 pl-8 px-2">
            <div className="flex flex-col space-y-8">
              {/* Active Filter Bar */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
                    {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'Actualités & Nouveautés'}
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

                  {(selectedCategory || selectedSubCategory || search || onSale || isNew || inStock || isArriving || commande48H || quoteMode || checkStock || isPrivate || priceRange[0] !== 0 || priceRange[1] !== absoluteMaxPrice || sortBy !== 'newest') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCategory(null);
                        setSelectedSubCategory(null);
                        setSubCategories([]);
                        setSearch('');
                        setOnSale(false);
                        setIsNew(false);
                        setInStock(false);
                        setIsArriving(false);
                        setCommande48H(false);
                        setQuoteMode(false);
                        setCheckStock(false);
                        setIsPrivate(false);
                        setPriceRange([0, absoluteMaxPrice]);
                        setSortBy('newest');
                      }}
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
                    <Card key={i} className="overflow-hidden border-none bg-muted/20">
                      <div className="p-3">
                        <Skeleton className="aspect-square rounded-2xl" />
                      </div>
                      <CardHeader className="p-5 space-y-3">
                        <Skeleton className="h-3 w-1/3" />
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-2/3" />
                      </CardHeader>
                      <CardFooter className="p-5">
                        <Skeleton className="h-10 w-full rounded-xl" />
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  products.map((product) => (
                    <Card
                      key={product.id}
                      className="group overflow-hidden border-none bg-card hover:bg-muted/30 transition-all duration-300 ring-1 ring-white/5 hover:ring-primary/30 flex flex-col"
                    >
                      <div className="relative p-3">
                        <div className="relative aspect-square overflow-hidden rounded-2xl bg-black/40 flex items-center justify-center p-0">
                          {product.onSale && (
                            <Badge className="absolute top-4 left-4 bg-orange-500 text-black font-black text-[10px] uppercase shadow-xl z-10 transition-transform group-hover:scale-110">
                              PROMO
                            </Badge>
                          )}
                          <img
                            src={product.images[0] ? `/api/images${product.images[0]}` : 'https://via.placeholder.com/400'}
                            alt={product.title}
                            className="w-full h-full object-cover brightness-110"
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
                            {product.onSale && product.salePrice ? (
                              <>
                                <span className="text-[10px] text-muted-foreground/60 line-through font-bold">
                                  {product.price.toLocaleString()} TND
                                </span>
                                <span className="text-xl font-black text-primary tracking-tight">
                                  {product.salePrice.toLocaleString()} <span className="text-[11px] font-bold opacity-70">TND</span>
                                </span>
                              </>
                            ) : (
                              <span className="text-xl font-black text-foreground tracking-tight">
                                {product.price.toLocaleString()} <span className="text-[11px] font-bold opacity-70">TND</span>
                              </span>
                            )}
                          </div>

                          <Button size="icon" className="h-10 w-10 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-110 hover:shadow-primary/40 active:scale-95 border-none">
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
      </div>
    </div>
  )
}

export default App