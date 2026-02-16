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
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const COMPLAINT_CATEGORIES = [
  { value: 'cybercrime', label: 'Cybercrime' },
  { value: 'electricity', label: 'Electricity Issue' },
  { value: 'internet', label: 'Internet Provider' },
  { value: 'college', label: 'College Administration' },
  { value: 'consumer', label: 'Consumer Grievance' },
];

interface ComplaintResult {
  formalComplaint: string;
  subjectLine: string;
  suggestedAuthority: string;
  suggestedPortal: string;
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
        },
      });

      if (error) throw error;

      const complaintResult: ComplaintResult = {
        formalComplaint: data.formalComplaint || '',
        subjectLine: data.subjectLine || '',
        suggestedAuthority: data.suggestedAuthority || '',
        suggestedPortal: data.suggestedPortal || '',
      };

      setResult(complaintResult);

      // Save to history
      await saveAnalysis.mutateAsync({
        analysis_type: 'complaint',
        input_text: incidentDescription,
        ai_result: complaintResult as unknown as Record<string, unknown>,
        category: category,
      });

      toast({
        title: 'Complaint Generated',
        description: 'Your formal complaint has been created.',
      });
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: 'Generation Failed',
        description: 'Could not generate the complaint. Please try again.',
        variant: 'destructive',
      });
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
    toast({
      title: 'Copied!',
      description: 'Complaint copied to clipboard.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!result) return;

    const fullText = `Subject: ${result.subjectLine}\n\n${result.formalComplaint}\n\n---\nSuggested Authority: ${result.suggestedAuthority}\nSuggested Portal: ${result.suggestedPortal}`;
    
    const blob = new Blob([fullText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `complaint_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Downloaded',
      description: 'Complaint saved to your device.',
    });
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
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-display font-bold">Complaint Generator</h1>
          </div>
          <p className="text-muted-foreground">
            Generate formal complaints for various issues with proper format and language.
          </p>
        </div>

        {/* Input Section */}
        <div className="glass-card rounded-xl p-6">
          <div className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="provider">Service Provider (Optional)</Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="provider"
                  placeholder="e.g., Company name, Organization"
                  value={serviceProvider}
                  onChange={(e) => setServiceProvider(e.target.value)}
                  className="pl-10 bg-secondary/50"
                />
              </div>
            </div>

            {/* Proxy Reporting Toggle */}
            <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-secondary/30 border border-border/30">
              <div className="flex items-center gap-3 min-w-0">
                <Users className="h-5 w-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-sm">Report for Someone Else</p>
                  <p className="text-xs text-muted-foreground truncate">
                    File on behalf of a family member or friend
                  </p>
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
                    <SelectItem value="grandparent">Grandparent</SelectItem>
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
                placeholder="Describe what happened in detail... (You can also use voice input)"
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
              <p className="font-semibold mt-1">{result.subjectLine}</p>
            </div>

            {/* Formal Complaint */}
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold">Formal Complaint</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    {copied ? (
                      <CheckCircle className="h-4 w-4 mr-1 text-success" />
                    ) : (
                      <Copy className="h-4 w-4 mr-1" />
                    )}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
              <div className="bg-secondary/30 rounded-lg p-4 whitespace-pre-wrap text-sm leading-relaxed">
                {result.formalComplaint}
              </div>
            </div>

            {/* Suggested Authority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-card rounded-xl p-6">
                <Label className="text-sm text-muted-foreground">Suggested Authority</Label>
                <p className="font-semibold mt-1">{result.suggestedAuthority}</p>
              </div>
              <div className="glass-card rounded-xl p-6">
                <Label className="text-sm text-muted-foreground">Suggested Portal</Label>
                <p className="font-semibold mt-1">{result.suggestedPortal}</p>
              </div>
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground text-center">
              ⚠️ This complaint is AI-generated. Please review and modify as needed before submission.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
