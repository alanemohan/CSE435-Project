import { Link } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Zap } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

export default function ScanLimitBanner() {
  const { scansUsed, scansLimit, canScan, plan } = useSubscription();
  const percentage = Math.min((scansUsed / scansLimit) * 100, 100);

  if (plan !== 'free') return null;

  return (
    <Alert className={!canScan ? 'border-destructive bg-destructive/5' : 'border-primary/20 bg-primary/5'}>
      <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex-1 w-full">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">
              {canScan ? `${scansUsed}/${scansLimit} scans used this month` : 'Monthly scan limit reached'}
            </span>
            <span className="text-xs text-muted-foreground">{Math.round(percentage)}%</span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>
        <Button asChild size="sm" variant={canScan ? 'outline' : 'default'}>
          <Link to="/pricing">
            <Zap className="h-3 w-3 mr-1" />
            Upgrade
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
