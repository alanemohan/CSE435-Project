import { cn } from '@/lib/utils';

interface ScamType {
  id: string;
  title: string;
  icon: React.ElementType;
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
      onClick={onClick}
      className={cn(
        'glass-card rounded-xl p-6 text-left hover:border-primary/50 transition-all hover:-translate-y-0.5',
        isSelected ? 'border-primary ring-2 ring-primary/20' : ''
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn('p-3 rounded-lg bg-card', scam.color)}>
          <scam.icon className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-display font-semibold mb-1">{scam.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{scam.description}</p>
        </div>
      </div>
    </button>
  );
}
