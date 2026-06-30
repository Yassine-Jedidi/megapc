import { useNavigate } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Category } from '@/types'

interface CategoryNavProps {
  categories: Category[];
  subCategories: Category[];
  selectedCategory: string | null;
  selectedSubCategory: string | null;
}

export function CategoryNav({
  categories,
  subCategories,
  selectedCategory,
  selectedSubCategory,
}: CategoryNavProps) {
  const navigate = useNavigate()

  return (
    <div>
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/50 mb-4">Catégories</h3>
      <div className="flex flex-col gap-1">
        {categories.filter(cat => cat._count.products > 0).map((cat) => (
          <div key={cat.id} className="flex flex-col">
            <Button
              variant={selectedCategory === cat.id ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-between text-[11px] font-bold uppercase tracking-wider h-9 px-3 rounded-xl transition-all duration-300 group",
                selectedCategory === cat.id ? "bg-primary/10 text-primary shadow-sm" : "hover:bg-primary/5 text-foreground/90 hover:text-foreground"
              )}
              onClick={() => {
                if (selectedCategory === cat.id) {
                  navigate('/')
                } else {
                  navigate(`/category/${cat.slug}`)
                }
              }}
            >
              <span className="flex items-center gap-2">
                {cat.name}
              </span>
              <span className="bg-white/10 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full min-w-5 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                {cat._count.products}
              </span>
            </Button>

            {selectedCategory === cat.id && subCategories.length > 0 && (
              <div className="flex flex-col ml-3 mt-1 pl-2 border-l border-primary/10 gap-0.5">
                {subCategories.map((sub) => (
                  <Button
                    key={sub.id}
                    variant={selectedSubCategory === sub.id ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-between text-[10px] font-bold uppercase tracking-wide h-7 px-3 rounded-lg transition-all",
                      selectedSubCategory === sub.id ? "text-primary bg-primary/5 font-black" : "text-foreground/90 hover:text-primary hover:bg-transparent"
                    )}
                    onClick={() => {
                      if (selectedSubCategory === sub.id) {
                        navigate(`/category/${cat.slug}`)
                      } else {
                        navigate(`/category/${cat.slug}/${sub.slug}`)
                      }
                    }}
                  >
                    <span>{sub.name}</span>
                    <span className="bg-white/10 text-white font-black text-[8px] px-1.5 py-0.5 rounded-full min-w-4 flex items-center justify-center">
                      {sub._count?.products || 0}
                    </span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
