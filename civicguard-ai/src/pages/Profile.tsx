import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import {
  User,
  Mail,
  Calendar,
  Shield,
  Edit3,
  Save,
  X,
  Activity,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Camera,
  Loader2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

export default function Profile() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch profile
  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch analysis stats
  const { data: stats } = useQuery({
    queryKey: ['profile-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('analysis_history')
        .select('id, analysis_type, risk_score, created_at')
        .eq('user_id', user.id);
      if (error) throw error;
      const total = data?.length || 0;
      const highRisk = data?.filter((a) => (a.risk_score ?? 0) >= 70).length || 0;
      const safe = data?.filter((a) => (a.risk_score ?? 0) < 30).length || 0;
      const lastAnalysis = data?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
      return { total, highRisk, safe, lastAnalysis };
    },
    enabled: !!user,
  });

  // Fetch vulnerability profile
  const { data: vulnProfile } = useQuery({
    queryKey: ['profile-vuln', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('vulnerability_profiles')
        .select('safety_score, risk_level, scam_exposure_count')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch evidence count
  const { data: evidenceCount } = useQuery({
    queryKey: ['profile-evidence', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from('evidence_vault')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName } as any)
        .eq('user_id', user.id);
      if (error) throw error;
      toast({ title: 'Profile Updated', description: 'Your profile has been saved successfully.' });
      setEditing(false);
      refetchProfile();
    } catch {
      toast({ title: 'Error', description: 'Failed to update profile.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image file.', variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Avatar must be under 2MB.', variant: 'destructive' });
      return;
    }

    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl } as any)
        .eq('user_id', user.id);
      if (updateError) throw updateError;

      toast({ title: 'Avatar Updated', description: 'Your profile picture has been changed.' });
      refetchProfile();
    } catch {
      toast({ title: 'Upload Failed', description: 'Could not upload avatar.', variant: 'destructive' });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const initials = (profile?.full_name || user?.email || 'U')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const safetyScore = vulnProfile?.safety_score ?? 100;
  const riskLevel = vulnProfile?.risk_level ?? 'low';

  const riskColor =
    riskLevel === 'high' ? 'text-danger' : riskLevel === 'medium' ? 'text-warning' : 'text-success';

  const statCards = [
    { icon: Activity, label: 'Total Analyses', value: stats?.total ?? 0, color: 'text-primary' },
    { icon: AlertTriangle, label: 'High Risk Found', value: stats?.highRisk ?? 0, color: 'text-danger' },
    { icon: CheckCircle, label: 'Safe Results', value: stats?.safe ?? 0, color: 'text-success' },
    { icon: FileText, label: 'Evidence Files', value: evidenceCount ?? 0, color: 'text-warning' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Header Card */}
        <Card className="overflow-hidden">
          <div className="h-32 relative" style={{ background: 'var(--gradient-primary)' }}>
            <div className="absolute inset-0 bg-background/10 backdrop-blur-[1px]" />
          </div>
          <CardContent className="relative pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16 relative z-10">
              <div className="relative group">
                <Avatar className="h-24 w-24 border-4 border-card shadow-lg">
                  <AvatarImage src={(profile as any)?.avatar_url} alt="Profile" />
                  <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    <Camera className="h-6 w-6 text-primary" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              <div className="flex-1 min-w-0 pt-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-display font-bold truncate">
                    {profile?.full_name || 'CivicShield User'}
                  </h1>
                  <Badge variant="secondary" className={riskColor}>
                    <Shield className="h-3 w-3 mr-1" />
                    {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm mt-1 truncate">{user?.email}</p>
              </div>
              <Button
                variant={editing ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => {
                  if (editing) {
                    setEditing(false);
                    setFullName(profile?.full_name || '');
                  } else {
                    setEditing(true);
                  }
                }}
              >
                {editing ? <><X className="h-4 w-4 mr-1" /> Cancel</> : <><Edit3 className="h-4 w-4 mr-1" /> Edit Profile</>}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.label} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
                <span className="text-2xl font-bold font-display">{stat.value}</span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Profile Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Profile Details
              </CardTitle>
              <CardDescription>Your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name" className="text-muted-foreground text-xs uppercase tracking-wider">
                  Full Name
                </Label>
                {editing ? (
                  <div className="flex gap-2">
                    <Input
                      id="profile-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="bg-secondary/50"
                    />
                    <Button size="sm" onClick={handleSave} disabled={saving}>
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm font-medium">{profile?.full_name || 'Not set'}</p>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Email
                </Label>
                <p className="text-sm font-medium">{user?.email}</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Member Since
                </Label>
                <p className="text-sm font-medium">
                  {user?.created_at ? format(new Date(user.created_at), 'MMMM d, yyyy') : '—'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Security Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Security Overview
              </CardTitle>
              <CardDescription>Your protection status at a glance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Safety Score */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Safety Score</span>
                  <span className={`text-xl font-bold font-display ${riskColor}`}>{safetyScore}/100</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${safetyScore}%`,
                      background:
                        safetyScore >= 70
                          ? 'hsl(var(--success))'
                          : safetyScore >= 40
                          ? 'hsl(var(--warning))'
                          : 'hsl(var(--danger))',
                    }}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" /> Scam Exposures
                  </span>
                  <span className="font-semibold">{vulnProfile?.scam_exposure_count ?? 0}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Last Analysis
                  </span>
                  <span className="font-semibold text-sm">
                    {stats?.lastAnalysis
                      ? format(new Date(stats.lastAnalysis.created_at), 'MMM d, yyyy')
                      : 'None yet'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Shield className="h-4 w-4" /> Risk Level
                  </span>
                  <Badge variant="outline" className={riskColor}>
                    {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
