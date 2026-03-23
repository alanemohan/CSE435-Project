import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface SmartAssistantProps {
  riskScore: number;
  scamType: string;
}

export default function SmartAssistant({ riskScore, scamType }: SmartAssistantProps) {
  const isHighRisk = riskScore >= 70;

  return (
    <div className="rounded-lg border border-border p-4 bg-card/70">
      <div className="flex items-start gap-3">
        {isHighRisk ? (
          <AlertTriangle className="h-5 w-5 text-danger mt-0.5" />
        ) : (
          <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
        )}
        <div>
          <p className="font-medium">Smart Assistant Summary</p>
          <p className="text-sm text-muted-foreground mt-1">
            {isHighRisk
              ? `High-risk pattern detected (${scamType}). Avoid sharing OTP, banking details, or making payments.`
              : `Current result appears lower risk (${scamType}). Still verify links, sender identity, and payment requests.`}
          </p>
        </div>
      </div>
    </div>
  );
}
