import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSaveAnalysis } from '@/hooks/useAnalysisHistory';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import VoiceInput from '@/components/VoiceInput';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Send,
  RotateCcw,
  Download,
  Copy,
  CheckCircle,
  MapPin,
  Calendar,
  Building,
  Users,
  AlertTriangle,
  Scale,
  Clock,
  IndianRupee,
  FileWarning,
  ExternalLink,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const COMPLAINT_CATEGORIES = [
  { value: 'cybercrime', label: '🔒 Cybercrime / Online Fraud', description: 'Hacking, phishing, identity theft, online financial fraud' },
  { value: 'banking', label: '🏦 Banking & Financial', description: 'Unauthorized transactions, card fraud, UPI scam' },
  { value: 'telecom', label: '📱 Telecom & Internet', description: 'Network issues, billing disputes, data throttling' },
  { value: 'electricity', label: '⚡ Electricity', description: 'Billing errors, power outages, meter tampering' },
  { value: 'consumer', label: '🛒 Consumer Grievance', description: 'Defective products, refund issues, misleading ads' },
  { value: 'college', label: '🎓 Education / College', description: 'Fee disputes, harassment, certificate issues' },
  { value: 'insurance', label: '🛡️ Insurance', description: 'Claim rejection, policy fraud, agent misconduct' },
  { value: 'real_estate', label: '🏠 Real Estate / Housing', description: 'Builder fraud, illegal possession, tenant disputes' },
  { value: 'transport', label: '🚗 Transport', description: 'Overcharging, route deviation, app-based cab issues' },
  { value: 'healthcare', label: '🏥 Healthcare', description: 'Overcharging, negligence, insurance claim denial' },
];

const URGENCY_LEVELS = [
  { value: 'low', label: 'Low', description: 'No immediate harm, can wait' },
  { value: 'medium', label: 'Medium', description: 'Financial loss occurred, needs attention' },
  { value: 'high', label: 'High', description: 'Ongoing fraud, immediate risk' },
  { value: 'critical', label: 'Critical', description: 'Life/safety threat, large financial loss' },
];

interface ComplaintResult {
  formalComplaint: string;
  subjectLine: string;
  suggestedAuthority: string;
  suggestedPortal: string;
  legalReferences: string[];
  nextSteps: string[];
  estimatedTimeline: string;
  alternativeAuthorities: string[];
}

export default function ComplaintGenerator() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const saveAnalysis = useSaveAnalysis();

  const [category, setCategory] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [location, setLocation] = useState('');
  const [serviceProvider, setServiceProvider] = useState('');
  const [urgency, setUrgency] = useState('medium');
  const [amountLost, setAmountLost] = useState('');
  const [hasEvidence, setHasEvidence] = useState(false);
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<ComplaintResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [isProxyReport, setIsProxyReport] = useState(false);
  const [proxyRelation, setProxyRelation] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleGenerate = async () => {
    if (!category || !incidentDescription.trim()) {
      toast({
        title: 'Error',
        description: 'Please select a category and describe the incident.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-complaint', {
        body: {
          category,
          incidentDescription,
          incidentDate,
          location,
          serviceProvider,
          urgency,
          amountLost,
          hasEvidence,
          evidenceDescription,
          isProxyReport,
          proxyRelation,
        },
      });

      if (error) throw error;

      const complaintResult: ComplaintResult = {
        formalComplaint: data.formalComplaint || '',
        subjectLine: data.subjectLine || '',
        suggestedAuthority: data.suggestedAuthority || '',
        suggestedPortal: data.suggestedPortal || '',
        legalReferences: data.legalReferences || [],
        nextSteps: data.nextSteps || [],
        estimatedTimeline: data.estimatedTimeline || '',
        alternativeAuthorities: data.alternativeAuthorities || [],
      };

      setResult(complaintResult);

      await saveAnalysis.mutateAsync({
        analysis_type: 'complaint',
        input_text: incidentDescription,
        ai_result: complaintResult as unknown as Record<string, unknown>,
        category: category,
      });

      toast({ title: 'Complaint Generated', description: 'Your formal complaint has been created.' });
    } catch (error) {
      console.error('Generation error:', error);
      toast({ title: 'Generation Failed', description: 'Could not generate the complaint. Please try again.', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setCategory('');
    setIncidentDescription('');
    setIncidentDate('');
    setLocation('');
    setServiceProvider('');
    setUrgency('medium');
    setAmountLost('');
    setHasEvidence(false);
    setEvidenceDescription('');
    setResult(null);
    setIsProxyReport(false);
    setProxyRelation('');
  };

  const handleVoiceTranscript = (text: string) => {
    setIncidentDescription((prev) => prev + (prev ? ' ' : '') + text);
  };

  const handleCopy = async () => {
    if (!result) return;
    const fullText = `Subject: ${result.subjectLine}\n\n${result.formalComplaint}`;
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast({ title: 'Copied!', description: 'Complaint copied to clipboard.' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!result) return;
    let fullText = `Subject: ${result.subjectLine}\n\n${result.formalComplaint}\n\n`;
    fullText += `---\nSuggested Authority: ${result.suggestedAuthority}\nSuggested Portal: ${result.suggestedPortal}\n`;
    if (result.legalReferences.length > 0) {
      fullText += `\nLegal References:\n${result.legalReferences.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n`;
    }
    if (result.nextSteps.length > 0) {
      fullText += `\nNext Steps:\n${result.nextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n`;
    }
    if (result.estimatedTimeline) {
      fullText += `\nEstimated Resolution Timeline: ${result.estimatedTimeline}\n`;
    }

    const blob = new Blob([fullText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `complaint_${category}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Downloaded', description: 'Complaint saved to your device.' });
  };

  const selectedCategory = COMPLAINT_CATEGORIES.find(c => c.value === category);

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
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 p-8" style={{ background: 'var(--gradient-hero)' }}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl md:text-3xl font-display font-bold">Smart Complaint Generator</h1>
            </div>
            <p className="text-muted-foreground max-w-xl">
              Generate legally-formatted complaints with relevant authority suggestions, legal references, and actionable next steps.
            </p>
          </div>
        </div>

        {/* Input Section */}
        <div className="glass-card rounded-xl p-6">
          <div className="space-y-5">
            {/* Category Selection */}
            <div className="space-y-2">
              <Label htmlFor="category">Complaint Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full bg-secondary/50">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {COMPLAINT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCategory && (
                <p className="text-xs text-muted-foreground pl-1">{selectedCategory.description}</p>
              )}
            </div>

            {/* Urgency Level */}
            <div className="space-y-2">
              <Label>Urgency Level</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {URGENCY_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setUrgency(level.value)}
                    className={`p-3 rounded-lg border text-left transition-all text-sm ${
                      urgency === level.value
                        ? level.value === 'critical' ? 'border-danger bg-danger/10 text-danger'
                        : level.value === 'high' ? 'border-warning bg-warning/10 text-warning'
                        : level.value === 'medium' ? 'border-primary bg-primary/10 text-primary'
                        : 'border-success bg-success/10 text-success'
                        : 'border-border/50 bg-secondary/30 text-muted-foreground hover:border-border'
                    }`}
                  >
                    <p className="font-medium">{level.label}</p>
                    <p className="text-xs opacity-80 mt-0.5">{level.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Incident Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="date"
                    type="date"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    className="pl-10 bg-secondary/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">City / State</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder="e.g., Mumbai, Maharashtra"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-10 bg-secondary/50"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="provider">Service Provider / Organization</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="provider"
                    placeholder="e.g., Company name"
                    value={serviceProvider}
                    onChange={(e) => setServiceProvider(e.target.value)}
                    className="pl-10 bg-secondary/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount Lost (₹)</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    placeholder="e.g., 5000"
                    value={amountLost}
                    onChange={(e) => setAmountLost(e.target.value)}
                    className="pl-10 bg-secondary/50"
                  />
                </div>
              </div>
            </div>

            {/* Evidence Toggle */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-secondary/30 border border-border/30">
                <div className="flex items-center gap-3 min-w-0">
                  <FileWarning className="h-5 w-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm">I Have Supporting Evidence</p>
                    <p className="text-xs text-muted-foreground truncate">Screenshots, receipts, transaction IDs, etc.</p>
                  </div>
                </div>
                <Switch checked={hasEvidence} onCheckedChange={setHasEvidence} />
              </div>
              {hasEvidence && (
                <Textarea
                  placeholder="Briefly describe your evidence (e.g., 'Screenshot of fraudulent transaction dated 15 Mar, UPI reference #12345')"
                  value={evidenceDescription}
                  onChange={(e) => setEvidenceDescription(e.target.value)}
                  className="min-h-[80px] bg-secondary/50 border-border/50 resize-none"
                />
              )}
            </div>

            {/* Proxy Reporting Toggle */}
            <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-secondary/30 border border-border/30">
              <div className="flex items-center gap-3 min-w-0">
                <Users className="h-5 w-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-sm">Report for Someone Else</p>
                  <p className="text-xs text-muted-foreground truncate">File on behalf of a family member or friend</p>
                </div>
              </div>
              <Switch checked={isProxyReport} onCheckedChange={setIsProxyReport} />
            </div>

            {isProxyReport && (
              <div className="space-y-2">
                <Label>Your Relationship to the Victim</Label>
                <Select value={proxyRelation} onValueChange={setProxyRelation}>
                  <SelectTrigger className="bg-secondary/50">
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="child">Son/Daughter</SelectItem>
                    <SelectItem value="grandparent">Grandparent</SelectItem>
                    <SelectItem value="spouse">Spouse</SelectItem>
                    <SelectItem value="friend">Friend</SelectItem>
                    <SelectItem value="neighbor">Neighbor</SelectItem>
                    <SelectItem value="relative">Other Relative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Incident Description *</Label>
                <VoiceInput onTranscript={handleVoiceTranscript} disabled={isGenerating} />
              </div>
              <Textarea
                id="description"
                placeholder="Describe what happened in detail — include dates, amounts, names, reference numbers..."
                value={incidentDescription}
                onChange={(e) => setIncidentDescription(e.target.value)}
                className="min-h-[150px] bg-secondary/50 border-border/50 focus:border-primary resize-none"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !category || !incidentDescription.trim()}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {isGenerating ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Generate Complaint
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleReset} disabled={isGenerating}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="space-y-6 animate-slide-up">
            {/* Subject Line */}
            <div className="glass-card rounded-xl p-6">
              <Label className="text-sm text-muted-foreground">Subject Line</Label>
              <p className="font-semibold mt-1 text-lg">{result.subjectLine}</p>
            </div>

            {/* Formal Complaint */}
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-lg">Formal Complaint</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    {copied ? <CheckCircle className="h-4 w-4 mr-1 text-success" /> : <Copy className="h-4 w-4 mr-1" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
              <div className="bg-secondary/30 rounded-lg p-5 whitespace-pre-wrap text-sm leading-relaxed font-mono">
                {result.formalComplaint}
              </div>
            </div>

            {/* Authority & Portal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-card rounded-xl p-6 border-l-4 border-l-primary">
                <div className="flex items-center gap-2 mb-2">
                  <Scale className="h-4 w-4 text-primary" />
                  <Label className="text-sm text-muted-foreground">Suggested Authority</Label>
                </div>
                <p className="font-semibold">{result.suggestedAuthority}</p>
              </div>
              <div className="glass-card rounded-xl p-6 border-l-4 border-l-success">
                <div className="flex items-center gap-2 mb-2">
                  <ExternalLink className="h-4 w-4 text-success" />
                  <Label className="text-sm text-muted-foreground">Filing Portal</Label>
                </div>
                <p className="font-semibold">{result.suggestedPortal}</p>
              </div>
            </div>

            {/* Legal References */}
            {result.legalReferences.length > 0 && (
              <div className="glass-card rounded-xl p-6">
                <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  Applicable Legal References
                </h3>
                <ul className="space-y-2">
                  {result.legalReferences.map((ref, i) => (
                    <li key={i} className="flex items-start gap-3 text-muted-foreground text-sm">
                      <Badge variant="outline" className="shrink-0 mt-0.5">{i + 1}</Badge>
                      {ref}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Next Steps */}
            {result.nextSteps.length > 0 && (
              <div className="glass-card rounded-xl p-6 border-success/30">
                <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  Recommended Next Steps
                </h3>
                <ol className="space-y-3">
                  {result.nextSteps.map((step, i) => (
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

            {/* Alternative Authorities */}
            {result.alternativeAuthorities && result.alternativeAuthorities.length > 0 && (
              <div className="glass-card rounded-xl p-6">
                <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                  <Building className="h-5 w-5 text-warning" />
                  Alternative Filing Options
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.alternativeAuthorities.map((auth, i) => (
                    <Badge key={i} variant="secondary" className="px-3 py-1.5 text-sm">{auth}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            {result.estimatedTimeline && (
              <div className="glass-card rounded-xl p-6 border-l-4 border-l-warning">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-warning" />
                  <div>
                    <Label className="text-sm text-muted-foreground">Estimated Resolution Timeline</Label>
                    <p className="font-semibold mt-0.5">{result.estimatedTimeline}</p>
                  </div>
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center">
              ⚠️ This complaint is AI-generated. Please review and modify as needed before submission. Legal references are indicative — consult a lawyer for serious matters.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
