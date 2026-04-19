import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, PackageOpen } from 'lucide-react'
import { Button } from "@/components/ui/button"

import type { Product, ProductDetailsProps } from '@/types'
import { ProductGallery } from './product/ProductGallery'
import { ProductInfo } from './product/ProductInfo'
import { PriceHistoryChart } from './product/PriceHistoryChart'
import { ProductDescription } from './product/ProductDescription'

export function ProductDetails({ onNavigate }: ProductDetailsProps) {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState<string>('')

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/products/${slug}`)
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
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Chargement...</p>
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
            />

            <PriceHistoryChart product={product} />

            <ProductDescription product={product} />
          </div>
        </div>
      </div>
    </div>
  )
}
