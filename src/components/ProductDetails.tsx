import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, ShoppingCart, Box, PackageOpen, ExternalLink } from 'lucide-react'
import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface ProductDetailsProps {
  onNavigate: (categoryId: string | null, subCategoryId: string | null) => void
}

interface ProductData {
  title: string;
  images: string[];
  price?: number;
  salePrice?: number;
  onSale: boolean;
  stock: number;
  checkStock: boolean;
  commande48H: boolean;
  isNew: boolean;
  quoteMode: boolean;
  description?: string;
  category?: { id: string, name: string };
  subCategory?: { id: string, name: string };
}

export function ProductDetails({ onNavigate }: ProductDetailsProps) {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<ProductData | null>(null)
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

  const isDevis = product.quoteMode

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

          {/* Images */}
          <div className="flex flex-col gap-6">
            <Card className="border-none bg-muted/20 ring-1 ring-white/5 overflow-hidden rounded-2xl aspect-square flex items-center justify-center p-8">
              {activeImage ? (
                <img
                  src={`/api/images${activeImage}`}
                  alt={product.title}
                  className="w-full h-full object-contain brightness-110"
                />
              ) : (
                <Box className="w-12 h-12 text-muted-foreground/10" />
              )}
            </Card>

            {product.images && product.images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {product.images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={cn(
                      "shrink-0 w-20 h-20 rounded-xl ring-1 transition-all bg-card flex items-center justify-center p-2",
                      activeImage === img ? 'ring-primary' : 'ring-white/5 opacity-50 hover:opacity-100'
                    )}
                  >
                    <img src={`/api/images${img}`} loading="lazy" decoding="async" className="w-full h-full object-contain" alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <span
                className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 cursor-pointer hover:text-foreground transition-colors"
                onClick={() => {
                  if (product?.category) {
                    onNavigate(product.category.id, null);
                    navigate('/');
                  }
                }}
              >
                {product.category?.name || 'Composant'}
              </span>
              {product.subCategory && (
                <>
                  <span className="text-muted-foreground/30">/</span>
                  <span
                    className="text-[10px] font-black uppercase tracking-[0.15em] text-primary/60 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => {
                      if (product?.category && product?.subCategory) {
                        onNavigate(product.category.id, product.subCategory.id);
                        navigate('/');
                      }
                    }}
                  >
                    {product.subCategory.name}
                  </span>
                </>
              )}
            </div>

            <h1 className="text-2xl lg:text-3xl font-black tracking-tight mb-6 leading-tight">
              {product.title}
            </h1>

            <div className="flex flex-wrap gap-2 mb-8">
              {product.onSale && (
                <Badge className="bg-orange-500 text-black font-black text-[10px] uppercase rounded-lg">PROMO</Badge>
              )}
              {product.isNew && (
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-none text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg">
                  NOUVEAUTÉ
                </Badge>
              )}
              {product.stock > 0 && (
                <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-none text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg">
                  EN STOCK
                </Badge>
              )}
              {product.commande48H && (
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-none text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg">
                  LIVRAISON 48H
                </Badge>
              )}
            </div>

            <div className="bg-muted/20 ring-1 ring-white/5 rounded-2xl p-8 mb-8">
              <div className="flex flex-col gap-1 mb-6">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Prix TTC</span>
                {isDevis ? (
                  <span className="text-3xl font-black text-sky-400 flex items-center gap-2">
                    <FileText className="h-6 w-6" /> SUR DEVIS
                  </span>
                ) : (
                  <div className="flex flex-col">
                    {product.salePrice && product.salePrice < (product.price || 0) && product.price ? (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[14px] text-muted-foreground/60 line-through font-bold">
                            {product.price.toLocaleString()} TND
                          </span>
                          <span className="text-[12px] bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-md font-black">
                            -{Math.round((1 - product.salePrice / product.price) * 100)}%
                          </span>
                        </div>
                        <span className="text-4xl font-black text-foreground tracking-tight">
                          {product.salePrice.toLocaleString()} <span className="text-lg font-bold opacity-70">TND</span>
                        </span>
                      </div>
                    ) : (
                      <span className="text-4xl font-black text-foreground tracking-tight">
                        {(product.price || 0).toLocaleString()} <span className="text-lg font-bold opacity-70">TND</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                {isDevis ? (
                  <Button className="h-12 w-full rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold uppercase text-[11px] tracking-wider border-none">
                    <FileText className="w-4 h-4 mr-2" /> Demander un devis
                  </Button>
                ) : (
                  <Button className="h-12 w-full rounded-xl bg-primary text-primary-foreground font-bold uppercase text-[11px] tracking-wider shadow-lg shadow-primary/20 border-none">
                    <ShoppingCart className="w-4 h-4 mr-2" /> Ajouter au panier
                  </Button>
                )}

                <a
                  href={`https://www.megapc.tn/shop/product/${slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "h-12 w-full rounded-xl border-white/10 bg-white/5 hover:bg-white/10 font-bold uppercase text-[11px] tracking-wider transition-colors"
                  )}
                >
                  <ExternalLink className="w-4 h-4 mr-2" /> Voir sur Megapc.tn
                </a>
              </div>
            </div>

            {product.description && (
              <div className="flex flex-col gap-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Description technique</h3>
                <Separator className="opacity-20" />
                <div
                  className="prose prose-invert prose-sm max-w-none text-foreground/85 leading-relaxed
                    prose-ul:list-disc prose-ul:pl-4 
                    prose-li:marker:text-primary/60 
                    prose-strong:text-white prose-strong:font-bold"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
