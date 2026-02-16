import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSaveAnalysis } from '@/hooks/useAnalysisHistory';
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
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AnalysisResult {
  riskScore: number;
  scamType: string;
  redFlags: string[];
  safetyAdvice: string[];
  detectedUrls: string[];
  detectedPhones: string[];
  manipulationTactics: string[];
  watchlistMatches: string[];
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

  const [messageText, setMessageText] = useState('');
  const [callDescription, setCallDescription] = useState('');
  const [messageType, setMessageType] = useState('sms');
  const [analysisMode, setAnalysisMode] = useState('message');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [patternSubmitted, setPatternSubmitted] = useState(false);
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
        body: {
          messageText,
          scamType,
          riskScore,
        },
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

    try {
      const textToAnalyze = analysisMode === 'call' ? callDescription : messageText;
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

      const analysisResult: AnalysisResult = {
        riskScore: data.riskScore,
        scamType: data.scamType,
        redFlags: data.redFlags || [],
        safetyAdvice: data.safetyAdvice || [],
        detectedUrls: data.detectedUrls || [],
        detectedPhones: data.detectedPhones || [],
        manipulationTactics: data.manipulationTactics || [],
        watchlistMatches,
      };

      setResult(analysisResult);

      // Save to history
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

      // Submit high-risk patterns to community database
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
    setProxyInfo({
      enabled: false,
      relationship: '',
      victimName: '',
      victimAge: '',
      victimCity: '',
    });
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

  // Prepare content for translation
  const getTranslatableContent = () => {
    if (!result) return '';
    let content = `Risk Level: ${result.riskScore}%\n`;
    content += `Scam Type: ${result.scamType}\n\n`;
    
    if (result.redFlags.length > 0) {
      content += `Red Flags:\n${result.redFlags.map(f => `• ${f}`).join('\n')}\n\n`;
    }
    
    if (result.safetyAdvice.length > 0) {
      content += `Safety Advice:\n${result.safetyAdvice.map(a => `• ${a}`).join('\n')}`;
    }
    
    return content;
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
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-danger/10">
              <MessageSquareWarning className="h-6 w-6 text-danger" />
            </div>
            <h1 className="text-2xl font-display font-bold">Scam Message Analyzer</h1>
          </div>
          <p className="text-muted-foreground">
            Analyze suspicious messages, screenshots, or describe phone calls to detect potential scams.
          </p>
        </div>

        {/* Proxy Reporting Mode */}
        <ProxyReportingMode onProxyChange={setProxyInfo} />

        {/* Input Section with Tabs */}
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
              {/* OCR Upload */}
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
                  className="min-h-[200px] bg-secondary/50 border-border/50 focus:border-primary resize-none"
                />
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
                  placeholder="Example: I received a call from someone claiming to be from SBI. They said my account was blocked and asked me to share my OTP to verify my identity. They sounded urgent and threatened legal action if I didn't comply..."
                  value={callDescription}
                  onChange={(e) => setCallDescription(e.target.value)}
                  className="min-h-[200px] bg-secondary/50 border-border/50 focus:border-primary resize-none"
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || (analysisMode === 'call' ? !callDescription.trim() : !messageText.trim())}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {isAnalyzing ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {analysisMode === 'call' ? 'Analyze Call' : 'Analyze Message'}
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={isAnalyzing}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="space-y-6 animate-slide-up">
            {/* Risk Score */}
            <div className="glass-card rounded-xl p-6">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <RiskMeter score={result.riskScore} size="lg" />
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-display font-semibold mb-2">
                    {result.scamType || 'Unknown Scam Type'}
                  </h3>
                  <p className="text-muted-foreground">
                    {result.riskScore >= 70
                      ? 'This message shows strong indicators of a scam. Do not respond or click any links.'
                      : result.riskScore >= 30
                      ? 'This message has some suspicious elements. Exercise caution before taking any action.'
                      : 'This message appears to be relatively safe, but always stay vigilant.'}
                  </p>
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
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full bg-warning/10 text-warning text-sm font-medium"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Red Flags */}
            {result.redFlags.length > 0 && (
              <div className="glass-card rounded-xl p-6">
                <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-danger" />
                  Red Flags Detected
                </h3>
                <ul className="space-y-2">
                  {result.redFlags.map((flag, i) => (
                    <li key={i} className="flex items-start gap-2 text-muted-foreground">
                      <AlertTriangle className="h-4 w-4 text-danger mt-0.5 shrink-0" />
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Manipulation Tactics */}
            {result.manipulationTactics.length > 0 && (
              <div className="glass-card rounded-xl p-6">
                <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Psychological Manipulation Tactics
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.manipulationTactics.map((tactic, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full bg-warning/10 text-warning text-sm"
                    >
                      {tactic}
                    </span>
                  ))}
                </div>
              </div>
            )}

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
                      {result.detectedUrls.map((url, i) => (
                        <li
                          key={i}
                          className="text-sm text-muted-foreground bg-secondary/50 px-3 py-2 rounded-lg break-all"
                        >
                          {url}
                        </li>
                      ))}
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
                        <li
                          key={i}
                          className="text-sm text-muted-foreground bg-secondary/50 px-3 py-2 rounded-lg"
                        >
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
                    <li key={i} className="flex items-start gap-2 text-muted-foreground">
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
            <LanguageTranslator 
              content={getTranslatableContent()} 
              contentType="scam analysis" 
            />

            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground text-center">
              ⚠️ This analysis is for informational purposes only and should not be considered as legal or professional advice.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
