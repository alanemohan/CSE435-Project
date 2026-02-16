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
import { FileText, Download, Copy, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ReportSection {
  heading: string;
  content: string;
}

interface ReportTemplate {
  title: string;
  referenceFormat?: string;
  sections: ReportSection[];
  footer: string;
  notes: string[];
  templateType: string;
  authority: string;
  format: string;
}

const TEMPLATE_TYPES = [
  { value: 'cybercrime', label: 'Cyber Crime FIR' },
  { value: 'consumer', label: 'Consumer Forum' },
  { value: 'college', label: 'College/University' },
  { value: 'company_hr', label: 'Company HR' },
  { value: 'rti', label: 'RTI Application' },
];

interface ReportTemplateGeneratorProps {
  incidentDescription: string;
  incidentDate?: string;
  location?: string;
}

export default function ReportTemplateGenerator({ 
  incidentDescription, 
  incidentDate, 
  location 
}: ReportTemplateGeneratorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('cybercrime');
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<ReportTemplate | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-report-template', {
        body: {
          templateType: selectedTemplate,
          incidentDescription,
          incidentDate,
          location,
        },
      });

      if (error) throw error;

      setReport(data);

      toast({
        title: 'Report Generated',
        description: `${data.format} template ready`,
      });
    } catch (error) {
      console.error('Report generation error:', error);
      toast({
        title: 'Generation Failed',
        description: 'Could not generate report template. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const formatReportAsText = (): string => {
    if (!report) return '';
    
    let text = `${report.title}\n${'='.repeat(report.title.length)}\n\n`;
    
    if (report.referenceFormat) {
      text += `Reference: ${report.referenceFormat}\n\n`;
    }
    
    report.sections.forEach(section => {
      text += `${section.heading}\n${'-'.repeat(section.heading.length)}\n${section.content}\n\n`;
    });
    
    text += `\n${report.footer}\n\n`;
    text += `Notes:\n${report.notes.map(n => `• ${n}`).join('\n')}`;
    
    return text;
  };

  const handleCopy = async () => {
    const text = formatReportAsText();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: 'Copied!', description: 'Report copied to clipboard.' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const text = formatReportAsText();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTemplate}_report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: 'Downloaded', description: 'Report saved to your device.' });
  };

  return (
    <div className="glass-card rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="h-5 w-5 text-primary" />
        <h4 className="font-display font-semibold">Authority Report Templates</h4>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
          <SelectTrigger className="flex-1 bg-secondary/50">
            <SelectValue placeholder="Select template type" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {TEMPLATE_TYPES.map((template) => (
              <SelectItem key={template.value} value={template.value}>
                {template.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button 
          onClick={handleGenerate} 
          disabled={isGenerating || !incidentDescription}
          className="shrink-0"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </>
          )}
        </Button>
      </div>

      {report && (
        <div className="space-y-4 mt-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <Badge variant="outline">{report.format}</Badge>
              <p className="text-sm text-muted-foreground mt-1">For: {report.authority}</p>
            </div>
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

          {/* Report Content */}
          <div className="bg-secondary/30 rounded-lg p-4 space-y-4">
            <h3 className="font-bold text-lg text-center">{report.title}</h3>
            
            {report.referenceFormat && (
              <p className="text-sm text-muted-foreground text-center">
                Reference: {report.referenceFormat}
              </p>
            )}

            {report.sections.map((section, i) => (
              <div key={i} className="border-t border-border/50 pt-3">
                <h4 className="font-semibold text-sm mb-2">{section.heading}</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {section.content}
                </p>
              </div>
            ))}

            <div className="border-t border-border/50 pt-3">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {report.footer}
              </p>
            </div>
          </div>

          {/* Notes */}
          {report.notes.length > 0 && (
            <div className="p-3 rounded-lg bg-warning/5 border border-warning/20">
              <p className="text-xs font-medium mb-2">Important Notes:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {report.notes.map((note, i) => (
                  <li key={i}>• {note}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
