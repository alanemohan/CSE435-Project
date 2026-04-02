import {
  Shield,
  Phone,
  MessageCircleX,
  FolderSearch,
  FileText,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface SmartAssistantProps {
  riskScore: number;
  scamType?: string;
}

interface ActionItem {
  icon: React.ElementType;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action?: string;
  link?: string;
}

export default function SmartAssistant({ riskScore, scamType }: SmartAssistantProps) {
  const getRecommendedActions = (): ActionItem[] => {
    const actions: ActionItem[] = [];

    if (riskScore >= 70) {
      actions.push({
        icon: MessageCircleX,
        title: 'Do NOT Reply',
        description: 'Block the sender immediately and do not respond to any messages.',
        priority: 'high',
      });
      actions.push({
        icon: Phone,
        title: 'Block This Number/Email',
        description: 'Add this contact to your block list to prevent future messages.',
        priority: 'high',
      });
      actions.push({
        icon: FolderSearch,
        title: 'Collect Evidence',
        description: 'Save screenshots and details before deleting.',
        priority: 'high',
        link: '/evidence-vault',
      });
      actions.push({
        icon: FileText,
        title: 'File a Complaint',
        description: 'Report this to the appropriate authorities.',
        priority: 'medium',
        link: '/complaint-generator',
      });
    } else if (riskScore >= 30) {
      actions.push({
        icon: AlertTriangle,
        title: 'Verify Before Acting',
        description: 'Contact the organization directly using official channels.',
        priority: 'medium',
      });
      actions.push({
        icon: FolderSearch,
        title: 'Save Evidence (Just in Case)',
        description: 'Keep screenshots if the situation escalates.',
        priority: 'low',
        link: '/evidence-vault',
      });
      actions.push({
        icon: Shield,
        title: 'Stay Vigilant',
        description: 'Monitor for follow-up attempts and similar messages.',
        priority: 'low',
      });
    } else {
      actions.push({
        icon: CheckCircle,
        title: 'Appears Safe',
        description: 'No immediate action needed, but always stay cautious.',
        priority: 'low',
      });
      actions.push({
        icon: Shield,
        title: 'General Safety Tips',
        description: 'Learn about common scam tactics to stay protected.',
        priority: 'low',
        link: '/education-hub',
      });
    }

    // Add scam-type specific recommendations
    if (scamType) {
      const lowerType = scamType.toLowerCase();
      
      if (lowerType.includes('otp') || lowerType.includes('banking')) {
        actions.unshift({
          icon: AlertTriangle,
          title: 'Never Share OTP',
          description: 'Banks and legitimate services will NEVER ask for your OTP.',
          priority: 'high',
        });
      }
      
      if (lowerType.includes('job') || lowerType.includes('employment')) {
        actions.push({
          icon: Shield,
          title: 'Verify Job Offer',
          description: 'Use our Job Checker to validate this opportunity.',
          priority: 'medium',
          link: '/job-checker',
        });
      }
    }

    return actions;
  };

  const actions = getRecommendedActions();

  const getPriorityStyles = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'border-danger/50 bg-danger/5';
      case 'medium':
        return 'border-warning/50 bg-warning/5';
      case 'low':
        return 'border-success/50 bg-success/5';
    }
  };

  const getPriorityBadge = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'bg-danger/10 text-danger';
      case 'medium':
        return 'bg-warning/10 text-warning';
      case 'low':
        return 'bg-success/10 text-success';
    }
  };

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-semibold">What Should I Do Next?</h3>
          <p className="text-sm text-muted-foreground">Smart recommendations based on your analysis</p>
        </div>
      </div>

      <div className="space-y-3">
        {actions.map((action, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${getPriorityStyles(action.priority)} transition-all hover:scale-[1.01]`}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-card">
                <action.icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm">{action.title}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${getPriorityBadge(action.priority)}`}>
                    {action.priority}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{action.description}</p>
                {action.link && (
                  <Link to={action.link}>
                    <Button variant="ghost" size="sm" className="mt-2 -ml-2 text-primary">
                      Take Action <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
