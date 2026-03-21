import { ArrowRight } from 'lucide-react';
import type { ElementType } from 'react';

interface ScamType {
  id: string;
  title: string;
  icon: ElementType;
  color: string;
  description: string;
  howItWorks: string[];
  redFlags: string[];
  protection: string[];
  realExample: string;
}

interface ScamTypeCardProps {
  scam: ScamType;
  isSelected: boolean;
  onClick: () => void;
}

export default function ScamTypeCard({ scam, isSelected, onClick }: ScamTypeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left glass-card rounded-xl p-5 transition-all border hover:scale-[1.01] ${
        isSelected ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/30'
      }`}
      aria-label={`View details for ${scam.title}`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-3 rounded-lg bg-secondary/50 ${scam.color}`}>
          <scam.icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold mb-1">{scam.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-3">{scam.description}</p>
        </div>
      </div>

      <div className="mt-4 inline-flex items-center gap-2 text-sm text-primary font-medium">
        Learn more
        <ArrowRight className="h-4 w-4" />
      </div>
    </button>
  );
}
