import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';

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

export default function ScamDetailView({ scam }: { scam: ScamType }) {
  return (
    <div className="glass-card rounded-xl p-6 animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-3 rounded-lg bg-card ${scam.color}`}>
          <scam.icon className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-display font-bold">{scam.title}</h2>
          <p className="text-muted-foreground">{scam.description}</p>
        </div>
      </div>

      <Tabs defaultValue="how" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="how">How It Works</TabsTrigger>
          <TabsTrigger value="flags">Red Flags</TabsTrigger>
          <TabsTrigger value="protect">Protection</TabsTrigger>
          <TabsTrigger value="example">Real Example</TabsTrigger>
        </TabsList>

        <TabsContent value="how" className="space-y-3">
          {scam.howItWorks.map((step, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">
                {i + 1}
              </span>
              <p className="text-sm">{step}</p>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="flags" className="space-y-3">
          {scam.redFlags.map((flag, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-danger/10 border border-danger/30">
              <XCircle className="h-5 w-5 text-danger shrink-0" />
              <p className="text-sm">{flag}</p>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="protect" className="space-y-3">
          {scam.protection.map((tip, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-success/10 border border-success/30">
              <CheckCircle className="h-5 w-5 text-success shrink-0" />
              <p className="text-sm">{tip}</p>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="example">
          <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm mb-2">⚠️ Real Scam Message Example</p>
                <p className="text-sm italic text-muted-foreground">{scam.realExample}</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
