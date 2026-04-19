import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { ProductDetails } from "@/components/ProductDetails"
import { Header } from "@/components/Header"
import { Sidebar } from "@/components/Sidebar"
import { Catalog } from "@/components/Catalog"
import { CartDrawer } from "@/components/CartDrawer"

import type { Product, Category, CartItem } from '@/types'

function App() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [subCategories, setSubCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
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
  const [absoluteMaxPrice, setAbsoluteMaxPrice] = useState(20000)
  const [priceRange, setPriceRange] = useState([0, 20000])
  const [sortBy, setSortBy] = useState('newest')

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

  // Reset to page 1 when any filter changes
  useEffect(() => {
    setPage(1)
  }, [search, selectedCategory, selectedSubCategory, onSale, isNew, inStock, isArriving, commande48H, quoteMode, checkStock, isPrivate, priceRange, sortBy])

  // Debounce search input: only update debouncedSearch after 300ms of no typing
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

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
      minPrice: priceRange[0].toString(),
      maxPrice: priceRange[1].toString(),
    }
  }, [debouncedSearch, onSale, isNew, inStock, isArriving, commande48H, quoteMode, checkStock, isPrivate, priceRange])

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

  const location = useLocation()

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
    // Fetch absolute max price to globally scale the slider
    fetch('/api/products/max-price')
      .then(r => r.json())
      .then(data => {
        setAbsoluteMaxPrice(data.maxPrice)
        setPriceRange([0, data.maxPrice])
      })
      .catch(e => console.error('Failed to get max price:', e))
      .finally(() => setIsConfigLoaded(true))
  }, [])

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
    setPriceRange([0, absoluteMaxPrice]);
    setSortBy('newest');
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
                        priceRange[0] !== 0 || 
                        priceRange[1] !== absoluteMaxPrice || 
                        sortBy !== 'newest';

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
              onNavigate={(catId, subId) => {
                setSelectedCategory(catId);
                setSelectedSubCategory(subId);
                if (catId) fetchSubCategories(catId);
              }}
              addToCart={addToCart}
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
                setSelectedSubCategory={setSelectedSubCategory}
                fetchSubCategories={fetchSubCategories}
                setSubCategories={setSubCategories}
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
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                absoluteMaxPrice={absoluteMaxPrice}
                search={search}
                sortBy={sortBy}
                onClearAll={handleClearAll}
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