import { Cpu, Monitor as Gpu } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SpecFiltersProps {
  selectedCpu: string | null;
  setSelectedCpu: (val: string | null) => void;
  selectedGpu: string | null;
  setSelectedGpu: (val: string | null) => void;
  availableCpus: string[];
  availableGpus: string[];
}

export function SpecFilters({
  selectedCpu,
  setSelectedCpu,
  selectedGpu,
  setSelectedGpu,
  availableCpus,
  availableGpus
}: SpecFiltersProps) {
  if (availableCpus.length === 0 && availableGpus.length === 0) return null;

  return (
    <div className="flex flex-col gap-6">
      {availableCpus.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
            <Cpu className="h-3 w-3" /> Processeur
          </h3>
          <Select
            value={selectedCpu || "all"}
            onValueChange={(val) => setSelectedCpu(val === "all" ? null : val)}
          >
            <SelectTrigger className="w-full h-9 rounded-xl border-none bg-background ring-1 ring-white/5 font-bold text-[10px] uppercase tracking-wider">
              <SelectValue placeholder="Choisir CPU" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-white/10 bg-background/95 backdrop-blur-md max-h-[300px]">
              <SelectItem value="all" className="text-xs font-bold uppercase tracking-wide">Tous les processeurs</SelectItem>
              {availableCpus.map(cpu => (
                <SelectItem key={cpu} value={cpu} className="text-xs font-bold uppercase tracking-wide">
                  {cpu}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {availableGpus.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
            <Gpu className="h-3 w-3" /> Carte Graphique
          </h3>
          <Select
            value={selectedGpu || "all"}
            onValueChange={(val) => setSelectedGpu(val === "all" ? null : val)}
          >
            <SelectTrigger className="w-full h-9 rounded-xl border-none bg-background ring-1 ring-white/5 font-bold text-[10px] uppercase tracking-wider">
              <SelectValue placeholder="Choisir GPU" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-white/10 bg-background/95 backdrop-blur-md max-h-[300px]">
              <SelectItem value="all" className="text-xs font-bold uppercase tracking-wide">Toutes les cartes</SelectItem>
              {availableGpus.map(gpu => (
                <SelectItem key={gpu} value={gpu} className="text-xs font-bold uppercase tracking-wide">
                  {gpu}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
