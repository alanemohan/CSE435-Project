import { cn } from '@/lib/utils';

interface RiskMeterProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function RiskMeter({ score, size = 'md', showLabel = true }: RiskMeterProps) {
  const getRiskLevel = (score: number) => {
    if (score < 30) return { label: 'Low Risk', color: 'text-success', bgColor: 'bg-success', glowClass: 'glow-success' };
    if (score < 70) return { label: 'Medium Risk', color: 'text-warning', bgColor: 'bg-warning', glowClass: 'glow-warning' };
    return { label: 'High Risk', color: 'text-danger', bgColor: 'bg-danger', glowClass: 'glow-danger' };
  };

  const risk = getRiskLevel(score);

  const sizeClasses = {
    sm: { container: 'w-24 h-24', text: 'text-2xl', label: 'text-xs' },
    md: { container: 'w-32 h-32', text: 'text-3xl', label: 'text-sm' },
    lg: { container: 'w-40 h-40', text: 'text-4xl', label: 'text-base' },
  };

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn('relative', sizeClasses[size].container)}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-secondary"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={cn(risk.color, 'transition-all duration-1000 ease-out')}
            style={{
              filter: `drop-shadow(0 0 6px currentColor)`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-display font-bold', sizeClasses[size].text, risk.color)}>
            {score}
          </span>
          <span className={cn('text-muted-foreground', sizeClasses[size].label)}>/ 100</span>
        </div>
      </div>
      {showLabel && (
        <span className={cn('font-semibold', sizeClasses[size].label, risk.color)}>
          {risk.label}
        </span>
      )}
    </div>
  );
}
