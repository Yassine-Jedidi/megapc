import { Separator } from "@/components/ui/separator"
import type { Product } from '@/types'

interface ProductDescriptionProps {
  product: Product;
}

export function ProductDescription({ product }: ProductDescriptionProps) {
  if (!product.description) return null

  return (
    <div className="mt-12 flex flex-col gap-4">
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
  )
}
