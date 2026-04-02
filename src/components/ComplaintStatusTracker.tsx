import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle, Clock, FileCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ComplaintStatusTrackerProps {
  analysisId: string;
  currentStatus: string | null;
  onStatusUpdate?: (newStatus: string) => void;
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', icon: FileCheck, color: 'bg-muted text-muted-foreground' },
  { value: 'submitted', label: 'Submitted', icon: Clock, color: 'bg-primary/20 text-primary' },
  { value: 'pending', label: 'Pending Response', icon: Clock, color: 'bg-warning/20 text-warning' },
  { value: 'resolved', label: 'Resolved', icon: CheckCircle, color: 'bg-success/20 text-success' },
];

export default function ComplaintStatusTracker({ analysisId, currentStatus, onStatusUpdate }: ComplaintStatusTrackerProps) {
  const [status, setStatus] = useState(currentStatus || 'draft');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('analysis_history')
        .update({ 
          status: newStatus,
          status_updated_at: new Date().toISOString()
        })
        .eq('id', analysisId);

      if (error) throw error;

      setStatus(newStatus);
      onStatusUpdate?.(newStatus);

      toast({
        title: 'Status Updated',
        description: `Complaint marked as ${newStatus}`,
      });
    } catch (error) {
      console.error('Status update error:', error);
      toast({
        title: 'Update Failed',
        description: 'Could not update status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const currentStatusOption = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
  const StatusIcon = currentStatusOption.icon;

  return (
    <div className="glass-card rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold flex items-center gap-2">
          <FileCheck className="h-4 w-4" />
          Complaint Status
        </h4>
        <Badge className={currentStatusOption.color}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {currentStatusOption.label}
        </Badge>
      </div>

      <div className="flex items-center gap-3">
        <Select value={status} onValueChange={handleStatusChange} disabled={isUpdating}>
          <SelectTrigger className="flex-1 bg-secondary/50">
            <SelectValue placeholder="Update status" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <option.icon className="h-4 w-4" />
                  {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>

      {/* Progress visualization */}
      <div className="flex items-center gap-1 pt-2">
        {STATUS_OPTIONS.map((option, index) => {
          const isActive = STATUS_OPTIONS.findIndex(s => s.value === status) >= index;
          return (
            <div key={option.value} className="flex-1 flex items-center">
              <div className={`h-2 flex-1 rounded-full transition-colors ${
                isActive ? 'bg-primary' : 'bg-secondary'
              }`} />
              {index < STATUS_OPTIONS.length - 1 && <div className="w-1" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
