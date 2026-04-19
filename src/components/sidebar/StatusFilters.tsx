import { Box, Zap, Rocket, Truck, Timer, FileText, ShieldCheck, Lock } from 'lucide-react'
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface StatusFiltersProps {
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
}

export function StatusFilters({
  inStock, setInStock,
  onSale, setOnSale,
  isNew, setIsNew,
  isArriving, setIsArriving,
  commande48H, setCommande48H,
  quoteMode, setQuoteMode,
  checkStock, setCheckStock,
  isPrivate, setIsPrivate
}: StatusFiltersProps) {
  const filters = [
    { id: 'in-stock', label: 'EN STOCK', icon: Box, iconColor: 'text-green-500', value: inStock, setter: setInStock },
    { id: 'on-sale', label: 'PROMO', icon: Zap, iconColor: 'text-orange-500', value: onSale, setter: setOnSale },
    { id: 'is-new', label: 'NOUVEAUTÉ', icon: Rocket, iconColor: 'text-blue-400', value: isNew, setter: setIsNew },
    { id: 'is-arriving', label: 'EN ARRIVAGE', icon: Truck, iconColor: 'text-purple-400', value: isArriving, setter: setIsArriving },
    { id: 'commande-48h', label: 'LIVRAISON 48H', icon: Timer, iconColor: 'text-emerald-400', value: commande48H, setter: setCommande48H },
    { id: 'quote-mode', label: 'SUR DEVIS', icon: FileText, iconColor: 'text-sky-400', value: quoteMode, setter: setQuoteMode },
    { id: 'check-stock', label: 'STOCK GARANTI', icon: ShieldCheck, iconColor: 'text-indigo-400', value: checkStock, setter: setCheckStock },
    { id: 'is-private', label: 'VENTES PRIVÉES', icon: Lock, iconColor: 'text-rose-500', value: isPrivate, setter: setIsPrivate },
  ]

  return (
    <div>
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/50 mb-4">Statut</h3>
      <div className="flex flex-col gap-4 px-1">
        {filters.map((f) => (
          <div key={f.id} className="flex items-center justify-between">
            <Label htmlFor={f.id} className="text-xs font-bold text-foreground/70 flex items-center gap-2 cursor-pointer">
              <f.icon className={`h-3 w-3 ${f.iconColor}`} /> {f.label}
            </Label>
            <Switch id={f.id} checked={f.value} onCheckedChange={f.setter} />
          </div>
        ))}
      </div>
    </div>
  )
}
