import { Search, ShoppingCart, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  search: string;
  setSearch: (search: string) => void;
}

export function Header({ sidebarOpen, setSidebarOpen, search, setSearch }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-0 mx-auto">
        <div className="flex items-center gap-6 min-w-[200px]">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:flex ml-4">
            {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
          </Button>
          <a href="/" className="flex items-center">
            <img src="https://megapc.tn/_next/image?url=%2Fassets%2Fimages%2Fmega.png&w=640&q=100" alt="Megapc" className="h-6 w-auto brightness-110 translate-y-1" />
          </a>
        </div>

        <div className="flex-1 flex justify-center px-6">
          <div className="relative w-full max-w-sm lg:max-w-md hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher sur Megapc..."
              className="pl-10 h-10 rounded-xl bg-muted/40 border-none ring-1 ring-white/5 focus-visible:ring-primary/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pr-4 min-w-[200px] justify-end">
          <Button variant="ghost" size="icon" className="relative">
            <ShoppingCart className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[8px] bg-primary">0</Badge>
          </Button>
        </div>
      </div>
    </header>
  )
}
