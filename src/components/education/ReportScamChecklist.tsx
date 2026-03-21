import { ShieldCheck, PhoneCall, Globe } from 'lucide-react';

const CHECKLIST_ITEMS = [
  {
    icon: ShieldCheck,
    title: 'Preserve evidence first',
    description: 'Take screenshots of messages, UPI IDs, transaction IDs, phone numbers, and fake profiles before deleting anything.',
  },
  {
    icon: PhoneCall,
    title: 'Report quickly on 1930',
    description: 'Call 1930 immediately for financial fraud cases. Faster reporting improves the chance of freezing fraudulent transactions.',
  },
  {
    icon: Globe,
    title: 'File complaint at cybercrime.gov.in',
    description: 'Submit a detailed report with supporting evidence so authorities can trace and act on scam patterns.',
  },
];

export default function ReportScamChecklist() {
  return (
    <div className="glass-card rounded-xl p-6 border-primary/20">
      <h2 className="font-display font-semibold mb-4">What To Do If You Were Scammed</h2>
      <div className="space-y-3">
        {CHECKLIST_ITEMS.map((item) => (
          <div key={item.title} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
            <item.icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
