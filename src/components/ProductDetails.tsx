import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, PackageOpen } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

import type { Product, ProductDetailsProps } from '@/types'
import { ProductGallery } from './product/ProductGallery'
import { ProductInfo } from './product/ProductInfo'
import { PriceHistoryChart } from './product/PriceHistoryChart'
import { ProductDescription } from './product/ProductDescription'

export function ProductDetails({ onNavigate, addToCart }: ProductDetailsProps) {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState<string>('')

  useEffect(() => {
    // Scroll to top INSTANTLY when navigation starts
    window.scrollTo({ top: 0, behavior: 'instant' });

    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${slug}`)
        const data = await res.json()
        setProduct(data)
        if (data.images && data.images.length > 0) {
          setActiveImage(data.images[0])
        }
      } catch (e) {
        console.error('Failed to load product details', e)
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [slug])

  useEffect(() => {
    if (!product || !product.images || product.images.length <= 1) return

    const interval = setInterval(() => {
      setActiveImage(current => {
        const index = product.images.indexOf(current)
        const nextIndex = (index + 1) % product.images.length
        return product.images[nextIndex]
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [product])

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="h-14 flex items-center border-b px-8">
          <Skeleton className="h-9 w-24 rounded-xl bg-muted/20" />
        </div>
        <div className="p-8 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="flex flex-col gap-6">
              <Skeleton className="aspect-square rounded-2xl bg-muted/20 w-full" />
              <div className="flex gap-4">
                <Skeleton className="h-20 w-20 rounded-xl bg-muted/20" />
                <Skeleton className="h-20 w-20 rounded-xl bg-muted/20" />
                <Skeleton className="h-20 w-20 rounded-xl bg-muted/20" />
              </div>
            </div>
            <div className="flex flex-col gap-8">
              <div className="space-y-4">
                <Skeleton className="h-3 w-1/4 bg-muted/20 rounded-lg" />
                <Skeleton className="h-10 w-3/4 bg-muted/20 rounded-xl" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16 bg-muted/20 rounded-lg" />
                  <Skeleton className="h-5 w-20 bg-muted/20 rounded-lg" />
                </div>
              </div>
              <Card className="p-8 border-none bg-muted/10 ring-1 ring-white/5 rounded-2xl space-y-8">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-20 bg-muted/20" />
                  <Skeleton className="h-6 w-16 bg-muted/20 rounded-lg" />
                </div>
                <Skeleton className="h-12 w-48 bg-muted/20" />
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full bg-muted/20 rounded-xl" />
                  <Skeleton className="h-12 w-full bg-muted/20 rounded-xl" />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
        <PackageOpen className="w-10 h-10 text-muted-foreground/20" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Produit non trouvé</h2>
        <Button onClick={() => navigate('/')} variant="secondary" size="sm" className="rounded-xl font-bold uppercase text-[10px] h-9">Retour à la boutique</Button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Navigation */}
      <div className="h-14 flex items-center border-b px-8">
        <Button
          onClick={() => navigate('/')}
          variant="ghost"
          size="sm"
          className="gap-2 font-bold uppercase text-[11px] h-9 rounded-xl hover:bg-muted/40"
        >
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>
      </div>

      <div className="p-8 lg:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <ProductGallery 
            product={product} 
            activeImage={activeImage} 
            setActiveImage={setActiveImage} 
          />

          <div className="flex flex-col">
            <ProductInfo 
              product={product} 
              onNavigate={onNavigate} 
              navigate={navigate} 
              slug={slug} 
              addToCart={addToCart}
            />

            <PriceHistoryChart product={product} />

            <ProductDescription product={product} />
          </div>
        </div>
      </div>
    </div>
  )
}
