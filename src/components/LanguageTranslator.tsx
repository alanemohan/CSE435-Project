import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Languages, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const LANGUAGES = [
  { code: 'hi', name: 'हिंदी (Hindi)' },
  { code: 'ta', name: 'தமிழ் (Tamil)' },
  { code: 'te', name: 'తెలుగు (Telugu)' },
  { code: 'bn', name: 'বাংলা (Bengali)' },
  { code: 'mr', name: 'मराठी (Marathi)' },
  { code: 'gu', name: 'ગુજરાતી (Gujarati)' },
  { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml', name: 'മലയാളം (Malayalam)' },
];

interface LanguageTranslatorProps {
  content: string;
  contentType?: string;
  onTranslated?: (translation: string, language: string) => void;
}

export default function LanguageTranslator({ content, contentType = 'analysis', onTranslated }: LanguageTranslatorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState('hi');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [translatedLanguage, setTranslatedLanguage] = useState<string | null>(null);

  const handleTranslate = async () => {
    if (!content) return;
    
    setIsTranslating(true);
    setTranslatedContent(null);

    try {
      const { data, error } = await supabase.functions.invoke('translate-result', {
        body: {
          content,
          targetLanguage: selectedLanguage,
          contentType,
        },
      });

      if (error) throw error;

      setTranslatedContent(data.translatedContent);
      setTranslatedLanguage(data.language);
      onTranslated?.(data.translatedContent, data.language);

      toast({
        title: 'Translation Complete',
        description: `Translated to ${data.language}`,
      });
    } catch (error) {
      console.error('Translation error:', error);
      toast({
        title: 'Translation Failed',
        description: 'Could not translate content. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="glass-card rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Languages className="h-5 w-5 text-primary" />
        <h4 className="font-semibold">Regional Language Translation</h4>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
          <SelectTrigger className="flex-1 bg-secondary/50">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button 
          onClick={handleTranslate} 
          disabled={isTranslating || !content}
          className="shrink-0"
        >
          {isTranslating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Translating...
            </>
          ) : (
            <>
              <Languages className="h-4 w-4 mr-2" />
              Translate
            </>
          )}
        </Button>
      </div>

      {translatedContent && (
        <div className="mt-4 p-4 rounded-lg bg-secondary/30 border border-border/50">
          <p className="text-xs text-muted-foreground mb-2">
            {translatedLanguage} Translation:
          </p>
          <p className="whitespace-pre-wrap text-sm">{translatedContent}</p>
        </div>
      )}
    </div>
  );
}
