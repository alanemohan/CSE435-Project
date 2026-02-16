import { cn } from '@/lib/utils';
import { Shield } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export default function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative">
        <div className={cn('animate-spin', sizeClasses[size])}>
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
              className="text-secondary"
            />
            <path
              d="M12 2a10 10 0 0 1 10 10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="text-primary"
            />
          </svg>
        </div>
        <Shield className={cn('absolute inset-0 m-auto text-primary/50', 
          size === 'sm' ? 'h-2 w-2' : size === 'md' ? 'h-4 w-4' : 'h-6 w-6'
        )} />
      </div>
      {text && <p className="text-muted-foreground text-sm animate-pulse">{text}</p>}
    </div>
  );
}
