import { useState, useEffect, useCallback } from 'react'
import { Search, ShoppingCart, Plus, Filter, LayoutGrid, X, Sparkles, Zap, Box } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

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
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [onSale, setOnSale] = useState(false)
  const [isNew, setIsNew] = useState(false)
  const [inStock, setInStock] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3001/api/categories')
      const data = await res.json()
      setCategories(data)
    } catch (e) {
      console.error('Failed to fetch categories', e)
    }
  }, [])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const query = new URLSearchParams({
        page: '1',
        limit: '48',
        search,
        onSale: onSale.toString(),
        isNew: isNew.toString(),
        inStock: inStock.toString(),
      })
      if (selectedCategory) query.append('categoryId', selectedCategory)

      const res = await fetch(`http://localhost:3001/api/products?${query}`)
      const data = await res.json()
      setProducts(data.products)
    } catch (e) {
      console.error('Failed to fetch products', e)
    } finally {
      setLoading(false)
    }
  }, [search, selectedCategory, onSale, isNew, inStock])

  useEffect(() => {
    document.documentElement.classList.add('dark')
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header Section */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between px-6 mx-auto">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:flex">
              <LayoutGrid className="h-5 w-5" />
            </Button>
            <a href="/" className="flex items-center">
              <img src="https://megapc.tn/_next/image?url=%2Fassets%2Fimages%2Fmega.png&w=640&q=100" alt="Megapc" className="h-6 w-auto brightness-110 translate-y-1" />
            </a>
          </div>

          <div className="flex flex-1 items-center justify-end space-x-6">
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
                       <Sparkles className="h-3 w-3 text-primary" /> NOUVEAUTÉ
                    </Label>
                    <Switch id="is-new" checked={isNew} onCheckedChange={setIsNew} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="in-stock" className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                       <Box className="h-3 w-3 text-green-500" /> EN STOCK
                    </Label>
                    <Switch id="in-stock" checked={inStock} onCheckedChange={setInStock} />
                  </div>
                </div>
              </div>

              <Separator className="opacity-20" />

              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Catégories</h3>
                <div className="flex flex-col gap-1">
                  {categories.filter(cat => cat._count.products > 0).map((cat) => (
                    <Button
                      key={cat.id}
                      variant={selectedCategory === cat.id ? "secondary" : "ghost"}
                      className={`justify-between h-10 px-3 font-bold text-xs rounded-xl transition-all ${selectedCategory === cat.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      <span className="truncate">{cat.name}</span>
                      <Badge variant="outline" className="text-[9px] font-bold py-0 h-4 border-white/5 bg-white/5">
                        {cat._count.products}
                      </Badge>
                    </Button>
                  ))}
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
                    Affichage de <span className="text-foreground font-bold">{products.length}</span> produits disponibles
                  </p>
                </div>
                {(selectedCategory || search || onSale || isNew || inStock) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCategory(null);
                      setSearch('');
                      setOnSale(false);
                      setIsNew(false);
                      setInStock(false);
                    }}
                    className="text-[10px] font-bold uppercase gap-2 hover:text-red-500"
                  >
                    <X className="h-3 w-3" /> Effacer les filtres
                  </Button>
                )}
              </div>

              {/* Grid Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pb-20">
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

                          <Button size="icon" className="h-10 w-10 rounded-2xl shadow-lg shadow-primary/10 hover:scale-110 transition-all active:scale-95 bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20">
                            <Plus className="h-5 w-5 stroke-[2.5px]" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App