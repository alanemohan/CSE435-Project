import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSaveAnalysis, useAnalysisHistory } from '@/hooks/useAnalysisHistory';
import { useKeywordWatchlist } from '@/hooks/useKeywordWatchlist';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RiskMeter from '@/components/ui/RiskMeter';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ImageUploader from '@/components/ImageUploader';
import LanguageTranslator from '@/components/LanguageTranslator';
import VoiceInput from '@/components/VoiceInput';
import ProxyReportingMode from '@/components/ProxyReportingMode';
import SmartAssistant from '@/components/SmartAssistant';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  MessageSquareWarning,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Send,
  RotateCcw,
  Shield,
  Phone,
  Link as LinkIcon,
  Tag,
  Users,
  PhoneCall,
  Copy,
  Download,
  Clock,
  Zap,
  Eye,
  ShieldAlert,
  ShieldCheck,
  Brain,
  Globe,
  Database,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ThreatIntelResult {
  url: string;
  urlhaus_match: boolean;
  threat?: string;
  tags?: string[];
}

interface AnalysisResult {
  riskScore: number;
  scamType: string;
  redFlags: string[];
  safetyAdvice: string[];
  detectedUrls: string[];
  detectedPhones: string[];
  manipulationTactics: string[];
  watchlistMatches: string[];
  threatIntelResults?: ThreatIntelResult[];
  threatIntelMatch?: boolean;
  dataSources?: string[];
}

interface ProxyInfo {
  enabled: boolean;
  relationship: string;
  victimName: string;
  victimAge: string;
  victimCity: string;
}

export default function ScamAnalyzer() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const saveAnalysis = useSaveAnalysis();
  const { data: watchlist } = useKeywordWatchlist();
  const { data: history } = useAnalysisHistory();

  const [messageText, setMessageText] = useState('');
  const [callDescription, setCallDescription] = useState('');
  const [messageType, setMessageType] = useState('sms');
  const [analysisMode, setAnalysisMode] = useState('message');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [patternSubmitted, setPatternSubmitted] = useState(false);
  const [analysisTime, setAnalysisTime] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [proxyInfo, setProxyInfo] = useState<ProxyInfo>({
    enabled: false,
    relationship: '',
    victimName: '',
    victimAge: '',
    victimCity: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const checkWatchlistMatches = (text: string): string[] => {
    if (!watchlist) return [];
    const lowerText = text.toLowerCase();
    return watchlist
      .filter((kw) => lowerText.includes(kw.keyword.toLowerCase()))
      .map((kw) => kw.keyword);
  };

  const submitToPatternDatabase = async (riskScore: number, scamType: string) => {
    try {
      const { data } = await supabase.functions.invoke('submit-scam-pattern', {
        body: { messageText, scamType, riskScore },
      });
      if (data?.submitted) {
        setPatternSubmitted(true);
        toast({
          title: 'Pattern Contributed',
          description: data.isNew
            ? 'New scam pattern identified and added to community database.'
            : `Similar pattern seen ${data.similarityCount} times before.`,
        });
      }
    } catch (error) {
      console.error('Pattern submission error:', error);
    }
  };

  const handleAnalyze = async () => {
    const textToAnalyze = analysisMode === 'call' ? callDescription : messageText;
    if (!textToAnalyze.trim()) {
      toast({
        title: 'Error',
        description: analysisMode === 'call'
          ? 'Please describe the phone call.'
          : 'Please enter a message to analyze.',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    setPatternSubmitted(false);
    const startTime = Date.now();

    try {
      const watchlistMatches = checkWatchlistMatches(textToAnalyze);
      const { data, error } = await supabase.functions.invoke('analyze-scam', {
        body: {
          message: textToAnalyze,
          messageType: analysisMode === 'call' ? 'call' : messageType,
          watchlistMatches,
          isCallSummary: analysisMode === 'call',
          proxyInfo: proxyInfo.enabled ? proxyInfo : null,
        },
      });

      if (error) throw error;
      setAnalysisTime(((Date.now() - startTime) / 1000));

      const analysisResult: AnalysisResult = {
        riskScore: data.riskScore,
        scamType: data.scamType,
        redFlags: data.redFlags || [],
        safetyAdvice: data.safetyAdvice || [],
        detectedUrls: data.detectedUrls || [],
        detectedPhones: data.detectedPhones || [],
        manipulationTactics: data.manipulationTactics || [],
        watchlistMatches,
        threatIntelResults: data.threatIntelResults,
        threatIntelMatch: data.threatIntelMatch,
        dataSources: data.dataSources,
      };

      setResult(analysisResult);

      await saveAnalysis.mutateAsync({
        analysis_type: 'scam',
        input_text: textToAnalyze,
        ai_result: {
          ...analysisResult,
          isProxyReport: proxyInfo.enabled,
          proxyInfo: proxyInfo.enabled ? proxyInfo : null,
        } as unknown as Record<string, unknown>,
        risk_score: analysisResult.riskScore,
        category: analysisResult.scamType,
      });

      if (analysisResult.riskScore >= 50) {
        submitToPatternDatabase(analysisResult.riskScore, analysisResult.scamType);
      }

      toast({
        title: 'Analysis Complete',
        description: `Risk level: ${analysisResult.riskScore >= 70 ? 'High' : analysisResult.riskScore >= 30 ? 'Medium' : 'Low'}`,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Could not analyze the message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setMessageText('');
    setCallDescription('');
    setResult(null);
    setPatternSubmitted(false);
    setAnalysisTime(0);
    setProxyInfo({ enabled: false, relationship: '', victimName: '', victimAge: '', victimCity: '' });
  };

  const handleVoiceTranscript = (text: string) => {
    if (analysisMode === 'call') {
      setCallDescription((prev) => prev + (prev ? ' ' : '') + text);
    } else {
      setMessageText((prev) => prev + (prev ? ' ' : '') + text);
    }
  };

  const handleOCRExtracted = (text: string) => {
    setMessageText(text);
  };

  const copyResultToClipboard = () => {
    if (!result) return;
    const text = `CivicShield Scam Analysis Report\n${'='.repeat(35)}\nRisk Score: ${result.riskScore}/100\nScam Type: ${result.scamType}\n\nRed Flags:\n${result.redFlags.map(f => `• ${f}`).join('\n')}\n\nSafety Advice:\n${result.safetyAdvice.map(a => `• ${a}`).join('\n')}\n\nManipulation Tactics: ${result.manipulationTactics.join(', ')}\n\nData Sources: ${result.dataSources?.join(', ') || 'AI Analysis'}`;
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Analysis report copied to clipboard.' });
  };

  const getTranslatableContent = () => {
    if (!result) return '';
    let content = `Risk Level: ${result.riskScore}%\nScam Type: ${result.scamType}\n\n`;
    if (result.redFlags.length > 0) content += `Red Flags:\n${result.redFlags.map(f => `• ${f}`).join('\n')}\n\n`;
    if (result.safetyAdvice.length > 0) content += `Safety Advice:\n${result.safetyAdvice.map(a => `• ${a}`).join('\n')}`;
    return content;
  };

  const getVerdictInfo = (score: number) => {
    if (score >= 80) return { label: 'DANGEROUS', color: 'bg-danger text-danger-foreground', icon: ShieldAlert, desc: 'This is almost certainly a scam. Do NOT interact.' };
    if (score >= 60) return { label: 'HIGH RISK', color: 'bg-danger/80 text-danger-foreground', icon: ShieldAlert, desc: 'Strong scam indicators detected. Proceed with extreme caution.' };
    if (score >= 40) return { label: 'SUSPICIOUS', color: 'bg-warning text-warning-foreground', icon: AlertTriangle, desc: 'Multiple suspicious elements found. Verify independently.' };
    if (score >= 20) return { label: 'LOW RISK', color: 'bg-success/80 text-success-foreground', icon: Shield, desc: 'Few concerns detected, but always stay vigilant.' };
    return { label: 'SAFE', color: 'bg-success text-success-foreground', icon: ShieldCheck, desc: 'No significant scam indicators found.' };
  };

  const recentScamHistory = history?.filter(h => h.analysis_type === 'scam').slice(0, 5) || [];

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
      <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-danger/20 to-danger/5">
                <MessageSquareWarning className="h-7 w-7 text-danger" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold">Scam Analyzer</h1>
                <p className="text-sm text-muted-foreground">AI + Real-time Threat Intelligence</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="gap-2"
            >
              <Clock className="h-4 w-4" />
              History ({recentScamHistory.length})
            </Button>
          </div>
        </div>

        {/* Quick History Panel */}
        {showHistory && recentScamHistory.length > 0 && (
          <div className="glass-card rounded-xl p-4 animate-slide-up">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Recent Scam Analyses
            </h3>
            <div className="space-y-2">
              {recentScamHistory.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    (item.risk_score ?? 0) >= 70 ? 'bg-danger' : (item.risk_score ?? 0) >= 30 ? 'bg-warning' : 'bg-success'
                  }`} />
                  <p className="text-sm truncate flex-1">{item.input_text.slice(0, 80)}...</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    (item.risk_score ?? 0) >= 70 ? 'bg-danger/10 text-danger' :
                    (item.risk_score ?? 0) >= 30 ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                  }`}>{item.risk_score ?? 0}%</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Proxy Reporting Mode */}
        <ProxyReportingMode onProxyChange={setProxyInfo} />

        {/* Input Section */}
        <div className="glass-card rounded-xl p-6">
          <Tabs value={analysisMode} onValueChange={setAnalysisMode} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="message" className="flex items-center gap-2">
                <MessageSquareWarning className="h-4 w-4" />
                Text/Image Analysis
              </TabsTrigger>
              <TabsTrigger value="call" className="flex items-center gap-2">
                <PhoneCall className="h-4 w-4" />
                Call Scam Summary
              </TabsTrigger>
            </TabsList>

            <TabsContent value="message" className="space-y-4">
              <div>
                <Label className="mb-2 block">Upload Screenshot (OCR)</Label>
                <ImageUploader onTextExtracted={handleOCRExtracted} disabled={isAnalyzing} />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or paste/speak text</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="messageType">Message Type</Label>
                <Select value={messageType} onValueChange={setMessageType}>
                  <SelectTrigger className="w-full bg-secondary/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="call">Call Script</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="message">Message Content</Label>
                  <VoiceInput onTranscript={handleVoiceTranscript} disabled={isAnalyzing} />
                </div>
                <Textarea
                  id="message"
                  placeholder="Paste the suspicious message here or use voice input..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="min-h-[180px] bg-secondary/50 border-border/50 focus:border-primary resize-none"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{messageText.length} characters</span>
                  {messageText.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      Ready to analyze
                    </span>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="call" className="space-y-4">
              <div className="p-4 rounded-lg bg-warning/10 border border-warning/30 mb-4">
                <div className="flex items-start gap-3">
                  <PhoneCall className="h-5 w-5 text-warning mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">📞 Call Scam Summary Tool</p>
                    <p className="text-sm text-muted-foreground">
                      Describe what the caller said, any red flags you noticed, and we'll analyze it for scam patterns.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="callDescription">Describe the Phone Call</Label>
                  <VoiceInput onTranscript={handleVoiceTranscript} disabled={isAnalyzing} />
                </div>
                <Textarea
                  id="callDescription"
                  placeholder="Example: I received a call from someone claiming to be from SBI..."
                  value={callDescription}
                  onChange={(e) => setCallDescription(e.target.value)}
                  className="min-h-[180px] bg-secondary/50 border-border/50 focus:border-primary resize-none"
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || (analysisMode === 'call' ? !callDescription.trim() : !messageText.trim())}
              className="flex-1 bg-primary hover:bg-primary/90 h-12 text-base"
            >
              {isAnalyzing ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span>Scanning threat databases...</span>
                </div>
              ) : (
                <>
                  <Zap className="h-5 w-5 mr-2" />
                  {analysisMode === 'call' ? 'Analyze Call' : 'Analyze Message'}
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={isAnalyzing} className="h-12">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* Analyzing animation */}
          {isAnalyzing && (
            <div className="mt-4 space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Brain className="h-3.5 w-3.5 animate-pulse text-primary" />
                  AI Analysis in progress...
                </span>
                <span className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-primary" />
                  Checking URLhaus, ThreatFox, PhishStats
                </span>
              </div>
              <Progress value={undefined} className="h-1.5" />
            </div>
          )}
        </div>

        {/* Results Section */}
        {result && (
          <div className="space-y-6 animate-slide-up">
            {/* Verdict Banner */}
            {(() => {
              const verdict = getVerdictInfo(result.riskScore);
              const VerdictIcon = verdict.icon;
              return (
                <div className={`rounded-xl p-5 ${verdict.color} flex flex-col sm:flex-row items-center gap-4`}>
                  <VerdictIcon className="h-10 w-10 shrink-0" />
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-3 mb-1">
                      <span className="text-2xl font-display font-black tracking-wide">{verdict.label}</span>
                      <span className="text-lg font-bold opacity-80">— {result.riskScore}/100</span>
                    </div>
                    <p className="text-sm opacity-90">{verdict.desc}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="secondary" size="sm" onClick={copyResultToClipboard} className="gap-1.5">
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </Button>
                  </div>
                </div>
              );
            })()}

            {/* Analysis Meta */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/50">
                <Clock className="h-3 w-3" />
                {analysisTime.toFixed(1)}s
              </span>
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/50">
                <Database className="h-3 w-3" />
                {result.dataSources?.length || 1} sources
              </span>
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                <Shield className="h-3 w-3" />
                {result.scamType}
              </span>
              {result.threatIntelMatch && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-danger/10 text-danger font-medium">
                  <ShieldAlert className="h-3 w-3" />
                  Threat DB Match
                </span>
              )}
            </div>

            {/* Risk Score Visual */}
            <div className="glass-card rounded-xl p-6">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <RiskMeter score={result.riskScore} size="lg" />
                <div className="flex-1 text-center md:text-left space-y-3">
                  <h3 className="text-xl font-display font-semibold">
                    {result.scamType || 'Unknown Scam Type'}
                  </h3>
                  <p className="text-muted-foreground">
                    {result.riskScore >= 70
                      ? 'This message shows strong indicators of a scam. Do not respond or click any links.'
                      : result.riskScore >= 30
                      ? 'This message has some suspicious elements. Exercise caution before taking any action.'
                      : 'This message appears to be relatively safe, but always stay vigilant.'}
                  </p>
                  {/* Confidence indicators */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-2 rounded-lg bg-secondary/30">
                      <p className="text-lg font-bold text-danger">{result.redFlags.length}</p>
                      <p className="text-[10px] text-muted-foreground">Red Flags</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-secondary/30">
                      <p className="text-lg font-bold text-warning">{result.manipulationTactics.length}</p>
                      <p className="text-[10px] text-muted-foreground">Tactics</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-secondary/30">
                      <p className="text-lg font-bold text-primary">{result.detectedUrls.length + result.detectedPhones.length}</p>
                      <p className="text-[10px] text-muted-foreground">IOCs Found</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pattern Contribution Badge */}
            {patternSubmitted && (
              <div className="glass-card rounded-xl p-4 border-primary/30 bg-primary/5">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Community Contribution</p>
                    <p className="text-sm text-muted-foreground">
                      This pattern has been anonymously contributed to help protect others.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Watchlist Matches */}
            {result.watchlistMatches.length > 0 && (
              <div className="glass-card rounded-xl p-6 border-warning/50">
                <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                  <Tag className="h-5 w-5 text-warning" />
                  Watchlist Matches
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.watchlistMatches.map((keyword, i) => (
                    <span key={i} className="px-3 py-1 rounded-full bg-warning/10 text-warning text-sm font-medium">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Red Flags & Manipulation side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.redFlags.length > 0 && (
                <div className="glass-card rounded-xl p-6">
                  <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-danger" />
                    Red Flags ({result.redFlags.length})
                  </h3>
                  <ul className="space-y-2">
                    {result.redFlags.map((flag, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground p-2 rounded-lg bg-danger/5">
                        <AlertTriangle className="h-4 w-4 text-danger mt-0.5 shrink-0" />
                        {flag}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.manipulationTactics.length > 0 && (
                <div className="glass-card rounded-xl p-6">
                  <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                    <Brain className="h-5 w-5 text-warning" />
                    Manipulation Tactics ({result.manipulationTactics.length})
                  </h3>
                  <div className="space-y-2">
                    {result.manipulationTactics.map((tactic, i) => (
                      <div key={i} className="px-3 py-2 rounded-lg bg-warning/5 border border-warning/10 text-sm text-muted-foreground">
                        ⚡ {tactic}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Detected URLs & Phones */}
            {(result.detectedUrls.length > 0 || result.detectedPhones.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.detectedUrls.length > 0 && (
                  <div className="glass-card rounded-xl p-6">
                    <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                      <LinkIcon className="h-5 w-5 text-primary" />
                      Detected URLs
                    </h3>
                    <ul className="space-y-2">
                      {result.detectedUrls.map((url, i) => {
                        const isMalicious = result.threatIntelResults?.some(r => r.url === url && r.urlhaus_match);
                        return (
                          <li key={i} className={`text-sm text-muted-foreground px-3 py-2 rounded-lg break-all flex items-start gap-2 ${
                            isMalicious ? 'bg-danger/10 border border-danger/20' : 'bg-secondary/50'
                          }`}>
                            {isMalicious && <ShieldAlert className="h-4 w-4 text-danger shrink-0 mt-0.5" />}
                            <span>{url}</span>
                            {isMalicious && <span className="text-danger text-xs font-bold shrink-0">MALICIOUS</span>}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                {result.detectedPhones.length > 0 && (
                  <div className="glass-card rounded-xl p-6">
                    <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                      <Phone className="h-5 w-5 text-primary" />
                      Detected Phone Numbers
                    </h3>
                    <ul className="space-y-2">
                      {result.detectedPhones.map((phone, i) => (
                        <li key={i} className="text-sm text-muted-foreground bg-secondary/50 px-3 py-2 rounded-lg">
                          {phone.replace(/(\d{3})\d{4}(\d+)/, '$1****$2')}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Safety Advice */}
            {result.safetyAdvice.length > 0 && (
              <div className="glass-card rounded-xl p-6 border-success/50">
                <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  Safety Recommendations
                </h3>
                <ul className="space-y-2">
                  {result.safetyAdvice.map((advice, i) => (
                    <li key={i} className="flex items-start gap-2 text-muted-foreground p-2 rounded-lg bg-success/5">
                      <Shield className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      {advice}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Smart Assistant */}
            <SmartAssistant riskScore={result.riskScore} scamType={result.scamType} />

            {/* Regional Language Translation */}
            <LanguageTranslator content={getTranslatableContent()} contentType="scam analysis" />

            {/* Threat Intelligence Sources */}
            {result.dataSources && result.dataSources.length > 0 && (
              <div className="glass-card rounded-xl p-6 border-primary/20">
                <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Threat Intelligence Sources
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {result.dataSources.map((src, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {src}
                    </span>
                  ))}
                </div>
                {result.threatIntelResults && result.threatIntelResults.some(r => r.urlhaus_match) && (
                  <div className="p-3 rounded-lg bg-danger/10 border border-danger/20">
                    <p className="text-sm text-danger font-medium">⚠️ URLs matched in threat databases:</p>
                    {result.threatIntelResults.filter(r => r.urlhaus_match).map((r, i) => (
                      <p key={i} className="text-xs text-muted-foreground mt-1 break-all">
                        {r.url} — Threat: {r.threat || 'malware'} {r.tags?.length ? `(${r.tags.join(', ')})` : ''}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground text-center">
              ⚠️ Analysis powered by AI + real-time threat intelligence from URLhaus, ThreatFox & PhishStats. Not legal advice.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
