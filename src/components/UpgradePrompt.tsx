import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Zap } from 'lucide-react';

interface UpgradePromptProps {
  feature: string;
  description?: string;
}

export default function UpgradePrompt({ feature, description }: UpgradePromptProps) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="flex flex-col items-center text-center py-12 gap-4">
        <div className="p-4 rounded-full bg-primary/10">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-bold">{feature} is a Premium Feature</h3>
        <p className="text-muted-foreground max-w-md">
          {description || `Upgrade to Premium to unlock ${feature} and many more advanced features.`}
        </p>
        <Button asChild size="lg" className="mt-2">
          <Link to="/pricing">
            <Zap className="h-4 w-4 mr-2" />
            Upgrade to Premium
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
