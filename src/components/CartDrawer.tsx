import { X, Plus, Minus, Trash2, ShoppingCart } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { CartItem } from '@/types'

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
}

export function CartDrawer({
  isOpen,
  onClose,
  cart,
  removeFromCart,
  updateQuantity
}: CartDrawerProps) {
  const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-100 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={cn(
          "fixed top-0 right-0 h-full w-full max-w-md bg-background border-l shadow-2xl z-101 transition-transform duration-500 ease-out flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest">Mon Panier</h2>
            <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px] font-black border-none">
              {totalItems}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl hover:bg-muted/40">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 flex flex-col gap-6">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-30">
                <ShoppingCart className="h-12 w-12" />
                <p className="text-[10px] font-black uppercase tracking-widest text-center">Votre panier est vide</p>
                <Button variant="outline" onClick={onClose} className="rounded-xl font-bold uppercase text-[10px] h-9 mt-4 px-8 border-white/10">Continuer mes achats</Button>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex gap-4 group">
                  <div className="h-20 w-20 shrink-0 bg-muted/20 rounded-xl ring-1 ring-white/5 overflow-hidden flex items-center justify-center p-2">
                    <img
                      src={`/api/images${item.image}`}
                      alt={item.title}
                      className="w-full h-full object-contain brightness-110"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div className="flex justify-between gap-4">
                      <h3 className="text-[11px] font-bold uppercase leading-tight line-clamp-2 hover:text-primary transition-colors cursor-pointer">
                        {item.title}
                      </h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center bg-muted/30 rounded-lg ring-1 ring-white/5 h-7">
                        <button
                          className="px-2 h-full hover:text-primary transition-colors disabled:opacity-30"
                          onClick={() => updateQuantity(item.id, -1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-[10px] font-black">{item.quantity}</span>
                        <button
                          className="px-2 h-full hover:text-primary transition-colors"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-[12px] font-black tabular-nums">
                        {(item.price * item.quantity).toLocaleString()} TND
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-6 border-t bg-muted/5 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-bold uppercase tracking-widest">
              <span>Total TTC</span>
              <span className="text-foreground text-sm font-black tabular-nums">{totalPrice.toLocaleString()} TND</span>
            </div>
            <p className="text-[9px] text-muted-foreground/50 font-bold uppercase tracking-widest line-clamp-1 italic text-right">
              TVA de 19% incluse dans le prix total
            </p>
          </div>
        )}
      </aside>
    </>
  )
}
