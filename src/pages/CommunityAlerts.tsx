import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bell,
  Search,
  TrendingUp,
  AlertTriangle,
  Clock,
  MapPin,
  Users,
  Shield,
  Phone,
  Briefcase,
  CreditCard,
  Mail,
  RefreshCw,
  Wifi,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

interface CommunityAlert {
  id: string;
  title: string;
  description: string;
  alert_type: string;
  severity: string;
  region: string | null;
  reported_count: number | null;
  first_reported_at: string;
  last_reported_at: string;
  is_active: boolean | null;
}

const getAlertIcon = (type: string) => {
  switch (type) {
    case 'phishing': return Mail;
    case 'job_scam': return Briefcase;
    case 'loan_scam': return CreditCard;
    case 'impersonation': return Phone;
    default: return AlertTriangle;
  }
};

const getAlertTypeLabel = (type: string) => {
  switch (type) {
    case 'phishing': return 'Phishing';
    case 'job_scam': return 'Job Scam';
    case 'loan_scam': return 'Loan Scam';
    case 'impersonation': return 'Impersonation';
    case 'otp_fraud': return 'OTP Fraud';
    default: return type;
  }
};

const getSeverityStyles = (severity: string) => {
  switch (severity) {
    case 'high': return 'bg-danger/10 text-danger border-danger/30';
    case 'medium': return 'bg-warning/10 text-warning border-warning/30';
    case 'low': return 'bg-success/10 text-success border-success/30';
    default: return 'bg-muted text-muted-foreground';
  }
};

export default function CommunityAlerts() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  // Fetch alerts from DB
  const { data: dbAlerts, isLoading } = useQuery({
    queryKey: ['community-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_alerts')
        .select('*')
        .eq('is_active', true)
        .order('last_reported_at', { ascending: false });
      if (error) throw error;
      setLastUpdated(new Date());
      return data as CommunityAlert[];
    },
    enabled: !!user,
    refetchInterval: 60000, // Auto-refresh every 60 seconds
  });

  // Fetch live alerts from AI
  const fetchLiveAlerts = async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-live-alerts');
      if (error) throw error;
      if (data?.success) {
        toast.success(`🔴 Live feed updated with ${data.count} real-time alerts`);
        queryClient.invalidateQueries({ queryKey: ['community-alerts'] });
        queryClient.invalidateQueries({ queryKey: ['alert-count'] });
      } else {
        throw new Error(data?.error || 'Failed to fetch');
      }
    } catch (err) {
      console.error('Live fetch error:', err);
      toast.error('Failed to fetch live alerts. Try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-fetch on first load if no alerts
  useEffect(() => {
    if (user && !isLoading && dbAlerts && dbAlerts.length === 0) {
      fetchLiveAlerts();
    }
  }, [user, isLoading, dbAlerts]);

  const alerts = dbAlerts || [];

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesType = typeFilter === 'all' || alert.alert_type === typeFilter;
    return matchesSearch && matchesSeverity && matchesType;
  });

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner size="lg" text="Loading alerts..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl border border-warning/20 p-8" style={{ background: 'var(--gradient-hero)' }}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-warning/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/10 text-warning text-sm font-medium mb-4 border border-warning/20">
                <Wifi className="h-4 w-4" />
                Live Intelligence Feed
                <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
              </div>
              <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">Community Alerts</h1>
              <p className="text-muted-foreground max-w-xl">
                AI-powered real-time scam intelligence from government portals, news, and community reports.
              </p>
              {lastUpdated && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last updated: {lastUpdated.toLocaleTimeString()} • Auto-refreshes every 60s
                </p>
              )}
            </div>
            <Button
              onClick={fetchLiveAlerts}
              disabled={isRefreshing}
              className="shrink-0 gap-2"
              variant="default"
            >
              {isRefreshing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              {isRefreshing ? 'Fetching Live Data...' : 'Fetch Latest Alerts'}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card rounded-xl p-5 border-l-4 border-l-danger hover:-translate-y-0.5 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-danger/10">
                <TrendingUp className="h-6 w-6 text-danger" />
              </div>
              <div>
                <p className="text-3xl font-display font-bold">
                  {alerts.filter((a) => a.severity === 'high').length}
                </p>
                <p className="text-sm text-muted-foreground">High Severity</p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-xl p-5 border-l-4 border-l-primary hover:-translate-y-0.5 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-display font-bold">
                  {alerts.reduce((acc, a) => acc + (a.reported_count || 0), 0).toLocaleString()}+
                </p>
                <p className="text-sm text-muted-foreground">Total Reports</p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-xl p-5 border-l-4 border-l-success hover:-translate-y-0.5 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-success/10">
                <Shield className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-3xl font-display font-bold">{alerts.length}</p>
                <p className="text-sm text-muted-foreground">Active Alerts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search alerts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/30 border-border/50"
              />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full md:w-[160px] bg-secondary/30 border-border/50">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="high">🔴 High</SelectItem>
                <SelectItem value="medium">🟡 Medium</SelectItem>
                <SelectItem value="low">🟢 Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[160px] bg-secondary/30 border-border/50">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="phishing">📧 Phishing</SelectItem>
                <SelectItem value="job_scam">💼 Job Scam</SelectItem>
                <SelectItem value="loan_scam">💳 Loan Scam</SelectItem>
                <SelectItem value="impersonation">📞 Impersonation</SelectItem>
                <SelectItem value="otp_fraud">🔐 OTP Fraud</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{filteredAlerts.length}</span> alerts
          </p>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            const AlertIcon = getAlertIcon(alert.alert_type);
            return (
              <div
                key={alert.id}
                className={`glass-card rounded-2xl p-6 border-l-4 ${
                  alert.severity === 'high' ? 'border-l-danger' :
                  alert.severity === 'medium' ? 'border-l-warning' : 'border-l-success'
                } hover:-translate-y-0.5 transition-all`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${
                    alert.severity === 'high' ? 'bg-danger/10' :
                    alert.severity === 'medium' ? 'bg-warning/10' : 'bg-success/10'
                  }`}>
                    <AlertIcon className={`h-6 w-6 ${
                      alert.severity === 'high' ? 'text-danger' :
                      alert.severity === 'medium' ? 'text-warning' : 'text-success'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-display font-semibold text-lg">{alert.title}</h3>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getSeverityStyles(alert.severity)}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-xs bg-secondary/80 text-muted-foreground font-medium">
                        {getAlertTypeLabel(alert.alert_type)}
                      </span>
                    </div>
                    <p className="text-muted-foreground mb-4 leading-relaxed">{alert.description}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      {alert.region && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/50">
                          <MapPin className="h-3.5 w-3.5" />
                          {alert.region}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/50">
                        <Users className="h-3.5 w-3.5" />
                        {(alert.reported_count || 0).toLocaleString()} reports
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/50">
                        <Clock className="h-3.5 w-3.5" />
                        {formatTimeAgo(alert.last_reported_at)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredAlerts.length === 0 && (
          <div className="glass-card rounded-2xl p-16 text-center">
            <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-6">
              <Shield className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="font-display font-semibold text-xl mb-2">No Alerts Found</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-4">
              Click "Fetch Latest Alerts" to pull real-time scam intelligence.
            </p>
            <Button onClick={fetchLiveAlerts} disabled={isRefreshing} className="gap-2">
              <Zap className="h-4 w-4" />
              Fetch Live Alerts
            </Button>
          </div>
        )}

        {/* Disclaimer */}
        <div className="glass-card rounded-2xl p-6 border-primary/20">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-display font-semibold mb-1">AI-Powered Live Intelligence</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Alerts are generated using AI analysis of real-world scam patterns from government portals, news sources, and community reports. Data refreshes automatically every 60 seconds.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
