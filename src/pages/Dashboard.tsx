import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalysisHistory } from '@/hooks/useAnalysisHistory';
import { useVulnerabilityProfile } from '@/hooks/useVulnerabilityProfile';
import { useAlertCount } from '@/hooks/useAlertCount';
import { useSubscription } from '@/hooks/useSubscription';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ScanLimitBanner from '@/components/ScanLimitBanner';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Progress } from '@/components/ui/progress';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  MessageSquareWarning,
  Briefcase,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  FolderLock,
  GraduationCap,
  Bell,
  Zap,
  Crown,
  Activity,
  Target,
  Eye,
  Clock,
  BarChart3,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

const COLORS = ['hsl(var(--danger))', 'hsl(var(--warning))', 'hsl(var(--success))'];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return '🌅 Good Morning';
  if (h < 17) return '☀️ Good Afternoon';
  if (h < 21) return '🌆 Good Evening';
  return '🌙 Good Night';
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { data: history, isLoading: historyLoading } = useAnalysisHistory();
  const { data: vulnerabilityProfile, isLoading: profileLoading } = useVulnerabilityProfile();
  const { data: alertCount } = useAlertCount();
  const { plan, scansUsed, scansLimit, isPremium } = useSubscription();
  const navigate = useNavigate();

  const { data: liveAlerts } = useQuery({
    queryKey: ['dashboard-live-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_alerts')
        .select('*')
        .eq('is_active', true)
        .order('last_reported_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || historyLoading || profileLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner size="lg" text="Loading dashboard..." />
        </div>
      </DashboardLayout>
    );
  }

  const scamAnalyses = history?.filter((h) => h.analysis_type === 'scam') || [];
  const jobChecks = history?.filter((h) => h.analysis_type === 'job') || [];
  const complaints = history?.filter((h) => h.analysis_type === 'complaint') || [];

  const highRiskCount = history?.filter((h) => (h.risk_score ?? 0) >= 70).length || 0;
  const mediumRiskCount = history?.filter((h) => (h.risk_score ?? 0) >= 30 && (h.risk_score ?? 0) < 70).length || 0;
  const lowRiskCount = history?.filter((h) => (h.risk_score ?? 0) < 30).length || 0;

  const pieData = [
    { name: 'High Risk', value: highRiskCount },
    { name: 'Medium Risk', value: mediumRiskCount },
    { name: 'Low Risk', value: lowRiskCount },
  ].filter((d) => d.value > 0);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const barData = last7Days.map((date) => {
    const dayHistory = history?.filter((h) => h.created_at.split('T')[0] === date) || [];
    return {
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      scam: dayHistory.filter((h) => h.analysis_type === 'scam').length,
      job: dayHistory.filter((h) => h.analysis_type === 'job').length,
      complaint: dayHistory.filter((h) => h.analysis_type === 'complaint').length,
    };
  });

  // Cumulative risk trend for area chart
  const trendData = last7Days.map((date) => {
    const dayItems = history?.filter((h) => h.created_at.split('T')[0] === date) || [];
    const avgRisk = dayItems.length > 0 ? Math.round(dayItems.reduce((s, h) => s + (h.risk_score ?? 0), 0) / dayItems.length) : 0;
    return {
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      avgRisk,
      count: dayItems.length,
    };
  });

  const avgRiskScore = history && history.length > 0
    ? Math.round(history.reduce((s, h) => s + (h.risk_score ?? 0), 0) / history.length)
    : 0;

  const stats = [
    { icon: MessageSquareWarning, label: 'Scam Analyses', value: scamAnalyses.length, color: 'text-danger', bgColor: 'bg-danger/10' },
    { icon: Briefcase, label: 'Job Checks', value: jobChecks.length, color: 'text-warning', bgColor: 'bg-warning/10' },
    { icon: FileText, label: 'Complaints', value: complaints.length, color: 'text-primary', bgColor: 'bg-primary/10' },
    { icon: TrendingUp, label: 'Total Scans', value: history?.length || 0, color: 'text-success', bgColor: 'bg-success/10' },
  ];

  const quickActions = [
    { icon: MessageSquareWarning, title: 'Analyze Message', description: 'Check if a message is a scam', path: '/scam-analyzer', color: 'from-danger/20 to-danger/5' },
    { icon: Briefcase, title: 'Verify Job Offer', description: 'Check job offer authenticity', path: '/job-checker', color: 'from-warning/20 to-warning/5' },
    { icon: FileText, title: 'Generate Complaint', description: 'Create formal complaints', path: '/complaint-generator', color: 'from-primary/20 to-primary/5' },
    { icon: FolderLock, title: 'Evidence Vault', description: 'Store case files securely', path: '/evidence-vault', color: 'from-success/20 to-success/5' },
  ];

  const getSafetyColor = (score: number) => {
    if (score >= 70) return 'text-success';
    if (score >= 40) return 'text-warning';
    return 'text-danger';
  };

  const getRiskIcon = (level: string | null) => {
    switch (level) {
      case 'high': return ShieldAlert;
      case 'medium': return Shield;
      default: return ShieldCheck;
    }
  };

  const RiskIcon = getRiskIcon(vulnerabilityProfile?.risk_level || null);

  const securityTips = [
    'Never share OTPs with anyone, even if they claim to be from your bank.',
    'Verify job offers directly on the company\'s official website.',
    'Legitimate organizations never ask for payment to process refunds.',
    'Check URLs carefully — scammers often use look-alike domains.',
    'If an offer sounds too good to be true, it probably is.',
  ];
  const randomTip = securityTips[Math.floor(new Date().getMinutes() / 12) % securityTips.length];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <ScanLimitBanner />

        {/* Header with greeting and plan */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold mb-1">{getGreeting()}</h1>
            <p className="text-muted-foreground">Here's your safety overview and recent activity.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              isPremium ? 'bg-warning/10 text-warning border border-warning/20' : 'bg-secondary text-muted-foreground'
            }`}>
              {isPremium ? <Crown className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
              {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-full bg-secondary/50 text-xs text-muted-foreground">
              <Activity className="h-3.5 w-3.5" />
              {scansUsed}/{scansLimit} scans
            </div>
          </div>
        </div>

        {/* Security Tip of the Moment */}
        <div className="glass-card rounded-xl p-4 border-l-4 border-l-primary bg-primary/5">
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-primary mb-0.5">SECURITY TIP</p>
              <p className="text-sm text-muted-foreground">{randomTip}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="glass-card rounded-xl p-5 hover:border-primary/30 transition-all hover:-translate-y-0.5 group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-muted-foreground text-xs">{stat.label}</p>
                  <p className="text-3xl font-display font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Average Risk + Quick Summary Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card rounded-xl p-5 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${avgRiskScore >= 60 ? 'bg-danger/10' : avgRiskScore >= 30 ? 'bg-warning/10' : 'bg-success/10'}`}>
              <Target className={`h-6 w-6 ${avgRiskScore >= 60 ? 'text-danger' : avgRiskScore >= 30 ? 'text-warning' : 'text-success'}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Risk Score</p>
              <p className={`text-2xl font-bold ${avgRiskScore >= 60 ? 'text-danger' : avgRiskScore >= 30 ? 'text-warning' : 'text-success'}`}>
                {avgRiskScore}%
              </p>
            </div>
          </div>

          <div className="glass-card rounded-xl p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-danger/10">
              <AlertTriangle className="h-6 w-6 text-danger" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">High Risk Found</p>
              <p className="text-2xl font-bold text-danger">{highRiskCount}</p>
            </div>
          </div>

          <div className="glass-card rounded-xl p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-success/10">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Safe Verified</p>
              <p className="text-2xl font-bold text-success">{lowRiskCount}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.path}
                to={action.path}
                className="glass-card rounded-xl p-5 hover:border-primary/30 transition-all group hover:-translate-y-1"
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-5 w-5 text-foreground" />
                </div>
                <h3 className="font-semibold text-sm mb-0.5 group-hover:text-primary transition-colors">{action.title}</h3>
                <p className="text-xs text-muted-foreground">{action.description}</p>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all mt-2" />
              </Link>
            ))}
          </div>
        </div>

        {/* Vulnerability Profile Widget */}
        <Link
          to="/vulnerability-analysis"
          className="glass-card rounded-2xl p-6 hover:border-primary/30 transition-all group border-l-4 border-l-primary block"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${
                vulnerabilityProfile?.risk_level === 'high' ? 'bg-danger/10' :
                vulnerabilityProfile?.risk_level === 'medium' ? 'bg-warning/10' : 'bg-success/10'
              }`}>
                <RiskIcon className={`h-6 w-6 ${
                  vulnerabilityProfile?.risk_level === 'high' ? 'text-danger' :
                  vulnerabilityProfile?.risk_level === 'medium' ? 'text-warning' : 'text-success'
                }`} />
              </div>
              <div>
                <h3 className="font-display font-semibold">Your Safety Score</h3>
                <p className="text-sm text-muted-foreground">AI-powered vulnerability analysis</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-4xl font-bold ${getSafetyColor(vulnerabilityProfile?.safety_score ?? 100)}`}>
                {vulnerabilityProfile?.safety_score ?? 100}
              </span>
              <p className="text-xs text-muted-foreground">/ 100</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                vulnerabilityProfile?.risk_level === 'high' ? 'bg-danger/10 text-danger' :
                vulnerabilityProfile?.risk_level === 'medium' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
              }`}>
                {(vulnerabilityProfile?.risk_level || 'low').toUpperCase()} RISK
              </span>
              {vulnerabilityProfile?.scam_exposure_count ? (
                <span className="text-xs text-muted-foreground">
                  {vulnerabilityProfile.scam_exposure_count} high-risk encounters
                </span>
              ) : null}
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </Link>

        {/* Feature Links Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/evidence-vault" className="glass-card rounded-xl p-4 hover:border-primary/30 transition-all group">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><FolderLock className="h-5 w-5 text-primary" /></div>
              <div className="flex-1">
                <h4 className="font-medium text-sm group-hover:text-primary">Evidence Vault</h4>
                <p className="text-xs text-muted-foreground">Store case files</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
            </div>
          </Link>

          <Link to="/education-hub" className="glass-card rounded-xl p-4 hover:border-primary/30 transition-all group">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10"><GraduationCap className="h-5 w-5 text-warning" /></div>
              <div className="flex-1">
                <h4 className="font-medium text-sm group-hover:text-primary">Education Hub</h4>
                <p className="text-xs text-muted-foreground">Learn about scams</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
            </div>
          </Link>

          <Link to="/community-alerts" className="glass-card rounded-xl p-4 hover:border-danger/30 transition-all group border border-danger/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-danger/10"><Bell className="h-5 w-5 text-danger" /></div>
              <div className="flex-1">
                <h4 className="font-medium text-sm group-hover:text-primary flex items-center gap-2">
                  Community Alerts
                  {alertCount ? (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-danger text-danger-foreground">{alertCount}</span>
                  ) : null}
                </h4>
                <p className="text-xs text-muted-foreground">Live scam intelligence</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
            </div>
            {liveAlerts && liveAlerts.length > 0 && (
              <div className="space-y-1.5">
                {liveAlerts.slice(0, 2).map((a) => (
                  <div key={a.id} className="flex items-center gap-2 text-xs p-1.5 rounded bg-secondary/30">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      a.severity === 'high' ? 'bg-danger' : a.severity === 'medium' ? 'bg-warning' : 'bg-success'
                    }`} />
                    <span className="truncate text-muted-foreground">{a.title}</span>
                  </div>
                ))}
              </div>
            )}
          </Link>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Chart */}
          <div className="glass-card rounded-2xl p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                Activity (Last 7 Days)
              </h3>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-danger" /><span className="text-muted-foreground">Scam</span></div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-warning" /><span className="text-muted-foreground">Job</span></div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary" /><span className="text-muted-foreground">Complaint</span></div>
              </div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="scam" fill="hsl(var(--danger))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="job" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="complaint" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risk Distribution */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-display font-semibold mb-4">Risk Distribution</h3>
            <div className="h-48 flex items-center justify-center">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground">
                  <Shield className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No data yet</p>
                </div>
              )}
            </div>
            {pieData.length > 0 && (
              <div className="flex justify-center gap-4 mt-2">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-danger" /><span className="text-xs text-muted-foreground">High</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-warning" /><span className="text-xs text-muted-foreground">Med</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-success" /><span className="text-xs text-muted-foreground">Low</span></div>
              </div>
            )}
          </div>
        </div>

        {/* Risk Trend Area Chart */}
        {history && history.length > 0 && (
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Risk Trend (7 Days)
            </h3>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--danger))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--danger))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="avgRisk" stroke="hsl(var(--danger))" fill="url(#riskGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {history && history.length > 0 && (
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Recent Activity
              </h3>
              <span className="text-xs text-muted-foreground">Last 5 analyses</span>
            </div>
            <div className="space-y-2">
              {history.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${
                    item.analysis_type === 'scam' ? 'bg-danger/10' :
                    item.analysis_type === 'job' ? 'bg-warning/10' : 'bg-primary/10'
                  }`}>
                    {item.analysis_type === 'scam' ? (
                      <MessageSquareWarning className="h-4 w-4 text-danger" />
                    ) : item.analysis_type === 'job' ? (
                      <Briefcase className="h-4 w-4 text-warning" />
                    ) : (
                      <FileText className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.category || (item.analysis_type === 'scam' ? 'Scam Analysis' : item.analysis_type === 'job' ? 'Job Verification' : 'Complaint')}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{item.input_text.slice(0, 60)}...</p>
                  </div>
                  {item.risk_score !== null && (
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                      item.risk_score >= 70 ? 'bg-danger/10 text-danger' :
                      item.risk_score >= 30 ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                    }`}>
                      {item.risk_score}%
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground hidden sm:block whitespace-nowrap">
                    {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
