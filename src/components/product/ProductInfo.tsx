import { ShoppingCart, FileText, ExternalLink, Eye, Calendar, Clock } from 'lucide-react'
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Product } from '@/types'

interface ProductInfoProps {
  product: Product;
  onNavigate: (categoryId: string | null, subCategoryId: string | null) => void;
  navigate: (path: string) => void;
  slug: string | undefined;
  addToCart: (product: Product) => void;
}

export function ProductInfo({ product, onNavigate, navigate, slug, addToCart }: ProductInfoProps) {
  const isDevis = product.quoteMode

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <span
          className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 cursor-pointer hover:text-foreground transition-colors"
          onClick={() => {
            if (product.category) {
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
                if (product.category && product.subCategory) {
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

      <h1 className="text-2xl lg:text-3xl font-black tracking-tight mb-4 leading-tight">
        {product.title}
      </h1>

      <div className="flex flex-col gap-2 mb-6 text-xs text-muted-foreground/60 font-bold uppercase tracking-wider">
        {(product.siteCreateDate || product.createdAt) && (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Ajouté le {new Date(product.siteCreateDate || '').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(' à', ' à')}
          </div>
        )}
        {(product.siteUpdateDate || product.updatedAt) && (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Mis à jour le {new Date(product.siteUpdateDate || '').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>

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
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Prix TTC</span>
          </div>
          <div className="flex items-center gap-1.5 text-foreground/80 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
            <Eye className="h-3 w-3" />
            <span className="text-[10px] font-black tracking-widest">{(product.viewCount || 0).toLocaleString()}</span>
          </div>
        </div>
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

        <div className="flex flex-col gap-3 mt-10">
          {isDevis ? (
            <Button className="h-12 w-full rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold uppercase text-[11px] tracking-wider border-none">
              <FileText className="w-4 h-4 mr-2" /> Demander un devis
            </Button>
          ) : (
            <Button
              onClick={() => addToCart(product)}
              className="h-12 w-full rounded-xl bg-primary text-primary-foreground font-bold uppercase text-[11px] tracking-wider shadow-lg shadow-primary/20 border-none"
            >
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
    </div>
  )
}
