import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSaveAnalysis } from '@/hooks/useAnalysisHistory';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RiskMeter from '@/components/ui/RiskMeter';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Briefcase,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Send,
  RotateCcw,
  Building,
  Mail,
  DollarSign,
  Shield,
  MapPin,
  Globe,
  Phone,
  GraduationCap,
  Clock,
  Users,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface JobAnalysisResult {
  authenticityScore: number;
  suspiciousIndicators: string[];
  verificationSteps: string[];
  companyDomainMatch: boolean;
  salaryAnalysis: string;
  overallAssessment: string;
  companyReputation: string;
  jobMarketComparison: string;
  communicationRedFlags: string[];
  legitimacyChecklist: { item: string; status: string }[];
}

const JOB_PLATFORMS = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'naukri', label: 'Naukri.com' },
  { value: 'indeed', label: 'Indeed' },
  { value: 'email', label: 'Direct Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'other', label: 'Other' },
];

export default function JobChecker() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const saveAnalysis = useSaveAnalysis();

  const [offerText, setOfferText] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [salaryOffered, setSalaryOffered] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [platform, setPlatform] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<JobAnalysisResult | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleAnalyze = async () => {
    if (!offerText.trim()) {
      toast({ title: 'Error', description: 'Please enter the job offer text.', variant: 'destructive' });
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-job', {
        body: {
          offerText,
          companyName,
          senderEmail,
          jobTitle,
          salaryOffered,
          jobLocation,
          platform,
          contactPhone,
        },
      });

      if (error) throw error;

      const analysisResult: JobAnalysisResult = {
        authenticityScore: 100 - data.riskScore,
        suspiciousIndicators: data.suspiciousIndicators || [],
        verificationSteps: data.verificationSteps || [],
        companyDomainMatch: data.companyDomainMatch ?? true,
        salaryAnalysis: data.salaryAnalysis || '',
        overallAssessment: data.overallAssessment || '',
        companyReputation: data.companyReputation || '',
        jobMarketComparison: data.jobMarketComparison || '',
        communicationRedFlags: data.communicationRedFlags || [],
        legitimacyChecklist: data.legitimacyChecklist || [],
      };

      setResult(analysisResult);

      await saveAnalysis.mutateAsync({
        analysis_type: 'job',
        input_text: offerText,
        ai_result: analysisResult as unknown as Record<string, unknown>,
        risk_score: 100 - analysisResult.authenticityScore,
        category: 'Job Offer',
      });

      toast({ title: 'Analysis Complete', description: `Authenticity: ${analysisResult.authenticityScore}%` });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({ title: 'Analysis Failed', description: 'Could not analyze the job offer. Please try again.', variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setOfferText('');
    setCompanyName('');
    setSenderEmail('');
    setJobTitle('');
    setSalaryOffered('');
    setJobLocation('');
    setPlatform('');
    setContactPhone('');
    setResult(null);
  };

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl border border-warning/20 p-8" style={{ background: 'var(--gradient-hero)' }}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-warning/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-warning/10">
                <Briefcase className="h-6 w-6 text-warning" />
              </div>
              <h1 className="text-2xl md:text-3xl font-display font-bold">Job Offer Authenticity Checker</h1>
            </div>
            <p className="text-muted-foreground max-w-xl">
              Advanced AI analysis to verify job offers, detect employment scams, and protect your career search.
            </p>
          </div>
        </div>

        {/* Input Section */}
        <div className="glass-card rounded-xl p-6">
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="companyName" placeholder="e.g., Google, TCS" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="pl-10 bg-secondary/50" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="senderEmail">Sender Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="senderEmail" placeholder="e.g., hr@company.com" value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} className="pl-10 bg-secondary/50" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="jobTitle" placeholder="e.g., Software Engineer" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="pl-10 bg-secondary/50" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary">Salary Offered (₹/year)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="salary" placeholder="e.g., 1200000" value={salaryOffered} onChange={(e) => setSalaryOffered(e.target.value)} className="pl-10 bg-secondary/50" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jobLocation">Job Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="jobLocation" placeholder="e.g., Bangalore" value={jobLocation} onChange={(e) => setJobLocation(e.target.value)} className="pl-10 bg-secondary/50" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Source Platform</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger className="bg-secondary/50">
                    <SelectValue placeholder="Where received?" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {JOB_PLATFORMS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="contactPhone" placeholder="+91..." value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="pl-10 bg-secondary/50" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="offerText">Job Offer Content *</Label>
              <Textarea
                id="offerText"
                placeholder="Paste the full job offer letter, email, or message content here..."
                value={offerText}
                onChange={(e) => setOfferText(e.target.value)}
                className="min-h-[200px] bg-secondary/50 border-border/50 focus:border-primary resize-none"
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleAnalyze} disabled={isAnalyzing || !offerText.trim()} className="flex-1 bg-primary hover:bg-primary/90">
                {isAnalyzing ? <LoadingSpinner size="sm" /> : (<><Send className="h-4 w-4 mr-2" />Verify Job Offer</>)}
              </Button>
              <Button variant="outline" onClick={handleReset} disabled={isAnalyzing}>
                <RotateCcw className="h-4 w-4 mr-2" />Reset
              </Button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="space-y-6 animate-slide-up">
            {/* Authenticity Score */}
            <div className="glass-card rounded-xl p-6">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <RiskMeter score={result.authenticityScore} size="lg" />
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-display font-semibold mb-2">Authenticity Score</h3>
                  <p className="text-muted-foreground">{result.overallAssessment}</p>
                </div>
              </div>
            </div>

            {/* Domain Match */}
            <div className={`glass-card rounded-xl p-6 border-l-4 ${result.companyDomainMatch ? 'border-l-success' : 'border-l-danger'}`}>
              <div className="flex items-center gap-3">
                {result.companyDomainMatch ? <CheckCircle className="h-6 w-6 text-success" /> : <XCircle className="h-6 w-6 text-danger" />}
                <div>
                  <h3 className="font-display font-semibold">Email Domain Verification</h3>
                  <p className="text-sm text-muted-foreground">
                    {result.companyDomainMatch ? 'Email domain appears to match the company.' : 'Email domain does not match expected company domain — this is suspicious!'}
                  </p>
                </div>
              </div>
            </div>

            {/* Legitimacy Checklist */}
            {result.legitimacyChecklist.length > 0 && (
              <div className="glass-card rounded-xl p-6">
                <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Legitimacy Checklist
                </h3>
                <div className="space-y-3">
                  {result.legitimacyChecklist.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      {item.status === 'pass' ? (
                        <CheckCircle className="h-5 w-5 text-success shrink-0" />
                      ) : item.status === 'fail' ? (
                        <XCircle className="h-5 w-5 text-danger shrink-0" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
                      )}
                      <span className="text-sm text-muted-foreground">{item.item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Salary & Market */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.salaryAnalysis && (
                <div className="glass-card rounded-xl p-6">
                  <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-warning" />
                    Salary Analysis
                  </h3>
                  <p className="text-sm text-muted-foreground">{result.salaryAnalysis}</p>
                </div>
              )}
              {result.jobMarketComparison && (
                <div className="glass-card rounded-xl p-6">
                  <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    Market Comparison
                  </h3>
                  <p className="text-sm text-muted-foreground">{result.jobMarketComparison}</p>
                </div>
              )}
            </div>

            {/* Company Reputation */}
            {result.companyReputation && (
              <div className="glass-card rounded-xl p-6">
                <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  Company Reputation Analysis
                </h3>
                <p className="text-sm text-muted-foreground">{result.companyReputation}</p>
              </div>
            )}

            {/* Suspicious Indicators */}
            {result.suspiciousIndicators.length > 0 && (
              <div className="glass-card rounded-xl p-6">
                <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-danger" />
                  Suspicious Indicators
                </h3>
                <ul className="space-y-2">
                  {result.suspiciousIndicators.map((indicator, i) => (
                    <li key={i} className="flex items-start gap-2 text-muted-foreground text-sm">
                      <AlertTriangle className="h-4 w-4 text-danger mt-0.5 shrink-0" />
                      {indicator}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Communication Red Flags */}
            {result.communicationRedFlags.length > 0 && (
              <div className="glass-card rounded-xl p-6">
                <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Communication Red Flags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.communicationRedFlags.map((flag, i) => (
                    <Badge key={i} variant="secondary" className="bg-warning/10 text-warning border-warning/30">{flag}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Verification Steps */}
            {result.verificationSteps.length > 0 && (
              <div className="glass-card rounded-xl p-6 border-success/30">
                <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-success" />
                  How to Verify This Offer
                </h3>
                <ol className="space-y-2">
                  {result.verificationSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-muted-foreground text-sm">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-success/10 text-success text-sm font-medium flex items-center justify-center">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center">
              ⚠️ This analysis is for informational purposes only. Always verify job offers through official company channels.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
