import { Box } from 'lucide-react'
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Product } from '@/types'

interface ProductGalleryProps {
  product: Product;
  activeImage: string;
  setActiveImage: (img: string) => void;
}

export function ProductGallery({ product, activeImage, setActiveImage }: ProductGalleryProps) {
  return (
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
  )
}
