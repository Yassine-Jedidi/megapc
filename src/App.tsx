import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, useLocation, useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ProductDetails } from "@/components/ProductDetails"
import { Header } from "@/components/Header"
import { Sidebar } from "@/components/Sidebar"
import { Catalog } from "@/components/Catalog"
import { CartDrawer } from "@/components/CartDrawer"

import type { Product, Category, CartItem } from '@/types'

interface CategoryRouteProps {
  categories: Category[];
  subCategories: Category[];
  selectedCategory: string | null;
  setSelectedCategory: (id: string | null) => void;
  selectedSubCategory: string | null;
  setSelectedSubCategory: (id: string | null) => void;
  fetchSubCategories: (catId: string) => void;
  sidebarOpen: boolean;
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
  setSortBy: (val: string) => void;
  onClearAll: () => void;
  selectedCpu: string | null;
  setSelectedCpu: (val: string | null) => void;
  selectedGpu: string | null;
  setSelectedGpu: (val: string | null) => void;
  availableCpus: string[];
  availableGpus: string[];
  priceTrend: string | null;
  setPriceTrend: (val: string | null) => void;
  products: Product[];
  loading: boolean;
  total: number;
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  getPages: () => (string | number)[];
  addToCart: (product: Product) => void;
  showClearAll: boolean;
}

function CategoryRoute({
  categories, subCategories, selectedCategory, setSelectedCategory,
  selectedSubCategory, setSelectedSubCategory, fetchSubCategories,
  sidebarOpen, inStock, setInStock, onSale, setOnSale, isNew, setIsNew,
  isArriving, setIsArriving, commande48H, setCommande48H, quoteMode, setQuoteMode,
  checkStock, setCheckStock, isPrivate, setIsPrivate, hasHistory, setHasHistory,
  priceRange, setPriceRange, absoluteMaxPrice, search, sortBy, setSortBy, onClearAll,
  selectedCpu, setSelectedCpu, selectedGpu, setSelectedGpu,
  availableCpus, availableGpus, priceTrend, setPriceTrend,
  products, loading, total, page, setPage, totalPages, getPages,
  addToCart, showClearAll
}: CategoryRouteProps) {
  const { categorySlug, subCategorySlug } = useParams<{ categorySlug: string; subCategorySlug: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    if (!categorySlug) return
    const cat = categories.find(c => c.slug === categorySlug)
    if (cat) {
      setSelectedCategory(cat.id)
      fetchSubCategories(cat.id)
    }
  }, [categorySlug, categories, setSelectedCategory, fetchSubCategories])

  useEffect(() => {
    if (!categorySlug || !subCategorySlug) return
    const sub = subCategories.find(s => s.slug === subCategorySlug)
    if (sub) {
      setSelectedSubCategory(sub.id)
    }
  }, [subCategorySlug, subCategories, setSelectedSubCategory])

  return (
    <>
      <Sidebar
        sidebarOpen={sidebarOpen}
        categories={categories}
        subCategories={subCategories}
        selectedCategory={selectedCategory}
        setSelectedCategory={(id) => {
          setSelectedCategory(id)
          if (id) {
            const cat = categories.find(c => c.id === id)
            if (cat) navigate(`/category/${cat.slug}`)
            else navigate('/')
          } else {
            navigate('/')
          }
        }}
        selectedSubCategory={selectedSubCategory}
        inStock={inStock} setInStock={setInStock}
        onSale={onSale} setOnSale={setOnSale}
        isNew={isNew} setIsNew={setIsNew}
        isArriving={isArriving} setIsArriving={setIsArriving}
        commande48H={commande48H} setCommande48H={setCommande48H}
        quoteMode={quoteMode} setQuoteMode={setQuoteMode}
        checkStock={checkStock} setCheckStock={setCheckStock}
        isPrivate={isPrivate} setIsPrivate={setIsPrivate}
        hasHistory={hasHistory} setHasHistory={setHasHistory}
        priceRange={priceRange} setPriceRange={setPriceRange}
        absoluteMaxPrice={absoluteMaxPrice}
        search={search}
        sortBy={sortBy}
        onClearAll={onClearAll}
        selectedCpu={selectedCpu} setSelectedCpu={setSelectedCpu}
        selectedGpu={selectedGpu} setSelectedGpu={setSelectedGpu}
        availableCpus={availableCpus} availableGpus={availableGpus}
        priceTrend={priceTrend} setPriceTrend={setPriceTrend}
      />
      <Catalog
        products={products}
        loading={loading}
        total={total}
        selectedCategoryName={categories.find(c => c.id === selectedCategory)?.name}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onClearAll={onClearAll}
        showClearAll={showClearAll}
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        getPages={getPages}
        addToCart={addToCart}
      />
    </>
  )
}

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [subCategories, setSubCategories] = useState<Category[]>([])
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null)
  const [onSale, setOnSale] = useState(false)
  const [isNew, setIsNew] = useState(false)
  const [inStock, setInStock] = useState(true)
  const [isArriving, setIsArriving] = useState(false)
  const [commande48H, setCommande48H] = useState(false)
  const [quoteMode, setQuoteMode] = useState(false)
  const [checkStock, setCheckStock] = useState(false)
  const [isPrivate, setIsPrivate] = useState(false)
  const [hasHistory, setHasHistory] = useState(false)
  const [absoluteMaxPrice, setAbsoluteMaxPrice] = useState(20000)
  const [priceRange, setPriceRange] = useState([0, 20000])
  const [sortBy, setSortBy] = useState('newest')
  const [selectedCpu, setSelectedCpu] = useState<string | null>(null)
  const [selectedGpu, setSelectedGpu] = useState<string | null>(null)
  const [priceTrend, setPriceTrend] = useState<string | null>(null)
  const [availableCpus, setAvailableCpus] = useState<string[]>([])
  const [availableGpus, setAvailableGpus] = useState<string[]>([])

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isConfigLoaded, setIsConfigLoaded] = useState(false)

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('megapc-cart')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    localStorage.setItem('megapc-cart', JSON.stringify(cart))
  }, [cart])

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id)
      if (existing) {
        return prev.map(item => 
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, {
        id: Math.random().toString(36).substring(2, 9),
        productId: product.id,
        title: product.title,
        price: product.salePrice || product.price,
        quantity: 1,
        image: product.images[0] || ''
      }]
    })
    setIsCartOpen(true)
  }

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const nextQty = Math.max(1, item.quantity + delta)
        return { ...item, quantity: nextQty }
      }
      return item
    }))
  }

  // Reset to page 1 and scroll to top when any filter changes
  useEffect(() => {
    setPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [search, selectedCategory, selectedSubCategory, onSale, isNew, inStock, isArriving, commande48H, quoteMode, checkStock, isPrivate, hasHistory, priceRange, sortBy, selectedCpu, selectedGpu, priceTrend])

  // Debounce search input: only update debouncedSearch after 300ms of no typing
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('search') || '')
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // Sync debounced search to URL query param
  useEffect(() => {
    const currentSearch = searchParams.get('search') || ''
    if (currentSearch === debouncedSearch) return

    const next = new URLSearchParams(searchParams)
    if (debouncedSearch) {
      next.set('search', debouncedSearch)
    } else {
      next.delete('search')
    }
    setSearchParams(next, { replace: true })
  }, [debouncedSearch, searchParams])

  const getSharedQueryParams = useCallback(() => {
    return {
      search: debouncedSearch,
      onSale: onSale.toString(),
      isNew: isNew.toString(),
      inStock: inStock.toString(),
      isArriving: isArriving.toString(),
      commande48H: commande48H.toString(),
      quoteMode: quoteMode.toString(),
      checkStock: checkStock.toString(),
      isPrivate: isPrivate.toString(),
      hasHistory: hasHistory.toString(),
      minPrice: priceRange[0].toString(),
      maxPrice: priceRange[1].toString(),
      cpu: selectedCpu || '',
      gpu: selectedGpu || '',
      priceTrend: priceTrend || '',
    }
  }, [debouncedSearch, onSale, isNew, inStock, isArriving, commande48H, quoteMode, checkStock, isPrivate, hasHistory, priceRange, selectedCpu, selectedGpu, priceTrend])

  const fetchCategories = useCallback(async () => {
    try {
      const query = new URLSearchParams(getSharedQueryParams())
      const res = await fetch(`/api/categories?${query}`)
      const data = await res.json()
      setCategories(data)
    } catch (e) {
      console.error('Failed to fetch categories', e)
    }
  }, [getSharedQueryParams])

  const fetchSubCategories = useCallback(async (catId: string) => {
    try {
      const query = new URLSearchParams(getSharedQueryParams())
      const res = await fetch(`/api/categories/${catId}/sub?${query}`)
      const data = await res.json()
      setSubCategories(data)
    } catch (e) {
      console.error('Failed to fetch sub-categories', e)
    }
  }, [getSharedQueryParams])

  const fetchProducts = useCallback(async (signal?: AbortSignal) => {
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

      const res = await fetch(`/api/products?${query}`, { signal })
      if (!res.ok) return
      const data = await res.json()
      setProducts(data.products)
      setTotalPages(data.pagination.totalPages)
      setTotal(data.pagination.total)
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== 'AbortError') {
        console.error('Failed to fetch products', e)
      }
    } finally {
      setLoading(false)
    }
  }, [page, selectedCategory, selectedSubCategory, sortBy, getSharedQueryParams])

  // Scroll Restoration Logic
  useEffect(() => {
    // Only restore if we are back on the home page, not loading, and have products
    if (location.pathname === '/' && !loading && products.length > 0) {
      const savedScroll = sessionStorage.getItem('catalog-scroll')
      if (savedScroll) {
        sessionStorage.removeItem('catalog-scroll')
        // Small delay to ensure the browser has actually rendered the card height
        setTimeout(() => {
          window.scrollTo({ top: parseInt(savedScroll), behavior: 'instant' })
        }, 30)
      }
    }
  }, [location.pathname, loading, products.length])

  useEffect(() => {
    document.documentElement.classList.add('dark')
    // Fetch absolute max price and initial specs
    fetch('/api/products/max-price')
      .then(r => r.json())
      .then(data => {
        setAbsoluteMaxPrice(data.maxPrice)
        setPriceRange([0, data.maxPrice])
      })
      .catch(e => console.error('Failed to get max price:', e))
      .finally(() => setIsConfigLoaded(true))
  }, [])

  useEffect(() => {
    const query = new URLSearchParams()
    if (selectedCategory) query.append('categoryId', selectedCategory)
    if (selectedSubCategory) query.append('subCategoryId', selectedSubCategory)
    
    fetch(`/api/products/specs?${query}`)
      .then(r => r.json())
      .then(data => {
        setAvailableCpus(data.cpus)
        setAvailableGpus(data.gpus)
      })
      .catch(e => console.error('Failed to fetch specs:', e))
  }, [selectedCategory, selectedSubCategory])

  // Trigger fetches with AbortController to cancel stale requests
  useEffect(() => {
    if (!isConfigLoaded) return
    const controller = new AbortController()
    fetchCategories()
    if (selectedCategory) fetchSubCategories(selectedCategory)
    fetchProducts(controller.signal)
    return () => controller.abort()
  }, [fetchProducts, fetchCategories, fetchSubCategories, selectedCategory, isConfigLoaded])

  // Simple page calculation for the UI
  const getPages = useCallback(() => {
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
  }, [page, totalPages])

  const handleClearAll = () => {
    setSelectedCategory(null);
    setSelectedSubCategory(null);
    setSubCategories([]);
    setSearch('');
    setOnSale(false);
    setIsNew(false);
    setInStock(true);
    setIsArriving(false);
    setCommande48H(false);
    setQuoteMode(false);
    setCheckStock(false);
    setIsPrivate(false);
    setHasHistory(false);
    setPriceRange([0, absoluteMaxPrice]);
    setSortBy('newest');
    setSelectedCpu(null);
    setSelectedGpu(null);
    setPriceTrend(null);
    navigate('/');
  };

  const isFilterActive = selectedCategory || 
                        selectedSubCategory || 
                        search || 
                        onSale || 
                        isNew || 
                        !inStock || 
                        isArriving || 
                        commande48H || 
                        quoteMode || 
                        checkStock || 
                        isPrivate || 
                        hasHistory ||
                        priceRange[0] !== 0 || 
                        priceRange[1] !== absoluteMaxPrice || 
                        sortBy !== 'newest' ||
                        selectedCpu ||
                        selectedGpu ||
                        priceTrend;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        search={search} 
        setSearch={setSearch} 
        cart={cart}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        removeFromCart={removeFromCart}
        updateQuantity={updateQuantity}
      />

      <div className="flex-1 flex container mx-auto">
        <Routes>
          <Route path="/produit/:slug" element={
            <ProductDetails
              onNavigate={(catSlug, subSlug) => {
                if (catSlug) {
                  if (subSlug) navigate(`/category/${catSlug}/${subSlug}`)
                  else navigate(`/category/${catSlug}`)
                }
              }}
              addToCart={addToCart}
            />
          } />
          <Route path="/category/:categorySlug/:subCategorySlug" element={
            <CategoryRoute
              sidebarOpen={sidebarOpen}
              categories={categories}
              subCategories={subCategories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedSubCategory={selectedSubCategory}
              setSelectedSubCategory={setSelectedSubCategory}
              fetchSubCategories={fetchSubCategories}
              inStock={inStock}
              setInStock={setInStock}
              onSale={onSale}
              setOnSale={setOnSale}
              isNew={isNew}
              setIsNew={setIsNew}
              isArriving={isArriving}
              setIsArriving={setIsArriving}
              commande48H={commande48H}
              setCommande48H={setCommande48H}
              quoteMode={quoteMode}
              setQuoteMode={setQuoteMode}
              checkStock={checkStock}
              setCheckStock={setCheckStock}
              isPrivate={isPrivate}
              setIsPrivate={setIsPrivate}
              hasHistory={hasHistory}
              setHasHistory={setHasHistory}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              absoluteMaxPrice={absoluteMaxPrice}
              search={search}
              sortBy={sortBy}
              setSortBy={setSortBy}
              onClearAll={handleClearAll}
              selectedCpu={selectedCpu}
              setSelectedCpu={setSelectedCpu}
              selectedGpu={selectedGpu}
              setSelectedGpu={setSelectedGpu}
              availableCpus={availableCpus}
              availableGpus={availableGpus}
              priceTrend={priceTrend}
              setPriceTrend={setPriceTrend}
              products={products}
              loading={loading}
              total={total}
              page={page}
              setPage={setPage}
              totalPages={totalPages}
              getPages={getPages}
              addToCart={addToCart}
              showClearAll={!!isFilterActive}
            />
          } />
          <Route path="/category/:categorySlug" element={
            <CategoryRoute
              sidebarOpen={sidebarOpen}
              categories={categories}
              subCategories={subCategories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedSubCategory={selectedSubCategory}
              setSelectedSubCategory={setSelectedSubCategory}
              fetchSubCategories={fetchSubCategories}
              inStock={inStock}
              setInStock={setInStock}
              onSale={onSale}
              setOnSale={setOnSale}
              isNew={isNew}
              setIsNew={setIsNew}
              isArriving={isArriving}
              setIsArriving={setIsArriving}
              commande48H={commande48H}
              setCommande48H={setCommande48H}
              quoteMode={quoteMode}
              setQuoteMode={setQuoteMode}
              checkStock={checkStock}
              setCheckStock={setCheckStock}
              isPrivate={isPrivate}
              setIsPrivate={setIsPrivate}
              hasHistory={hasHistory}
              setHasHistory={setHasHistory}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              absoluteMaxPrice={absoluteMaxPrice}
              search={search}
              sortBy={sortBy}
              setSortBy={setSortBy}
              onClearAll={handleClearAll}
              selectedCpu={selectedCpu}
              setSelectedCpu={setSelectedCpu}
              selectedGpu={selectedGpu}
              setSelectedGpu={setSelectedGpu}
              availableCpus={availableCpus}
              availableGpus={availableGpus}
              priceTrend={priceTrend}
              setPriceTrend={setPriceTrend}
              products={products}
              loading={loading}
              total={total}
              page={page}
              setPage={setPage}
              totalPages={totalPages}
              getPages={getPages}
              addToCart={addToCart}
              showClearAll={!!isFilterActive}
            />
          } />
          <Route path="/" element={
            <>
              <Sidebar 
                sidebarOpen={sidebarOpen}
                categories={categories}
                subCategories={subCategories}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selectedSubCategory={selectedSubCategory}
                inStock={inStock}
                setInStock={setInStock}
                onSale={onSale}
                setOnSale={setOnSale}
                isNew={isNew}
                setIsNew={setIsNew}
                isArriving={isArriving}
                setIsArriving={setIsArriving}
                commande48H={commande48H}
                setCommande48H={setCommande48H}
                quoteMode={quoteMode}
                setQuoteMode={setQuoteMode}
                checkStock={checkStock}
                setCheckStock={setCheckStock}
                isPrivate={isPrivate}
                setIsPrivate={setIsPrivate}
                hasHistory={hasHistory}
                setHasHistory={setHasHistory}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                absoluteMaxPrice={absoluteMaxPrice}
                search={search}
                sortBy={sortBy}
                onClearAll={handleClearAll}
                selectedCpu={selectedCpu}
                setSelectedCpu={setSelectedCpu}
                selectedGpu={selectedGpu}
                setSelectedGpu={setSelectedGpu}
                availableCpus={availableCpus}
                availableGpus={availableGpus}
                priceTrend={priceTrend}
                setPriceTrend={setPriceTrend}
              />
              <Catalog 
                products={products}
                loading={loading}
                total={total}
                selectedCategoryName={categories.find(c => c.id === selectedCategory)?.name}
                sortBy={sortBy}
                setSortBy={setSortBy}
                onClearAll={handleClearAll}
                showClearAll={!!isFilterActive}
                page={page}
                setPage={setPage}
                totalPages={totalPages}
                getPages={getPages}
                addToCart={addToCart}
              />
            </>
          } />
        </Routes>
      </div>
    </div>
  )
}

export default App