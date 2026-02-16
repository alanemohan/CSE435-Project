import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, User, AlertCircle } from 'lucide-react';

interface ProxyInfo {
  enabled: boolean;
  relationship: string;
  victimName: string;
  victimAge: string;
  victimCity: string;
}

interface ProxyReportingModeProps {
  onProxyChange: (proxyInfo: ProxyInfo) => void;
}

const RELATIONSHIPS = [
  { value: 'parent', label: 'Parent' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'friend', label: 'Friend' },
  { value: 'neighbor', label: 'Neighbor' },
  { value: 'colleague', label: 'Colleague' },
  { value: 'other', label: 'Other Family/Relative' },
];

export default function ProxyReportingMode({ onProxyChange }: ProxyReportingModeProps) {
  const [enabled, setEnabled] = useState(false);
  const [relationship, setRelationship] = useState('');
  const [victimName, setVictimName] = useState('');
  const [victimAge, setVictimAge] = useState('');
  const [victimCity, setVictimCity] = useState('');

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    onProxyChange({
      enabled: checked,
      relationship,
      victimName,
      victimAge,
      victimCity,
    });
  };

  const handleChange = (field: string, value: string) => {
    const updates: Partial<ProxyInfo> = {
      enabled,
      relationship,
      victimName,
      victimAge,
      victimCity,
      [field]: value,
    };

    if (field === 'relationship') setRelationship(value);
    if (field === 'victimName') setVictimName(value);
    if (field === 'victimAge') setVictimAge(value);
    if (field === 'victimCity') setVictimCity(value);

    onProxyChange(updates as ProxyInfo);
  };

  return (
    <div className="glass-card rounded-xl p-4 border-dashed">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-sm">Report for Someone Else</h3>
            <p className="text-xs text-muted-foreground">Help a family member or friend</p>
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={handleToggle} />
      </div>

      {enabled && (
        <div className="space-y-4 pt-4 border-t border-border animate-fade-in">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30">
            <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
            <p className="text-xs text-warning">
              You are reporting on behalf of someone else. All information will be clearly attributed in any formal complaints generated.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="relationship">Your Relationship</Label>
              <Select value={relationship} onValueChange={(v) => handleChange('relationship', v)}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map((rel) => (
                    <SelectItem key={rel.value} value={rel.value}>
                      {rel.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="victimName">Victim's Name (Optional)</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="victimName"
                  placeholder="First name only"
                  value={victimName}
                  onChange={(e) => handleChange('victimName', e.target.value)}
                  className="pl-10 bg-secondary/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="victimAge">Victim's Age Group</Label>
              <Select value={victimAge} onValueChange={(v) => handleChange('victimAge', v)}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Select age group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="18-25">18-25 years</SelectItem>
                  <SelectItem value="26-40">26-40 years</SelectItem>
                  <SelectItem value="41-55">41-55 years</SelectItem>
                  <SelectItem value="56-65">56-65 years</SelectItem>
                  <SelectItem value="65+">65+ years (Senior Citizen)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="victimCity">Victim's City</Label>
              <Input
                id="victimCity"
                placeholder="e.g., Mumbai"
                value={victimCity}
                onChange={(e) => handleChange('victimCity', e.target.value)}
                className="bg-secondary/50"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
