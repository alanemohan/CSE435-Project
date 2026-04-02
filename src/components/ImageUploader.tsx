import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ImageUploaderProps {
  onTextExtracted: (text: string) => void;
  disabled?: boolean;
}

export default function ImageUploader({ onTextExtracted, disabled }: ImageUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload an image file (PNG, JPG, etc.)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please upload an image smaller than 10MB',
        variant: 'destructive',
      });
      return;
    }

    // Create preview
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);

    // Convert to base64
    setIsProcessing(true);
    try {
      const base64 = await fileToBase64(file);
      
      const { data, error } = await supabase.functions.invoke('ocr-analyze', {
        body: { imageBase64: base64 },
      });

      if (error) throw error;

      if (data.success && data.extractedText) {
        onTextExtracted(data.extractedText);
        toast({
          title: 'Text Extracted',
          description: 'Screenshot text has been extracted successfully.',
        });
      } else {
        toast({
          title: 'No Text Found',
          description: data.error || 'Could not extract text from the image.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('OCR error:', error);
      toast({
        title: 'OCR Failed',
        description: 'Could not process the image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const clearPreview = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isProcessing}
      />

      {previewUrl ? (
        <div className="relative">
          <div className="relative rounded-lg overflow-hidden border border-border bg-secondary/30">
            <img 
              src={previewUrl} 
              alt="Screenshot preview" 
              className="max-h-48 w-full object-contain"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-background/80 hover:bg-background"
              onClick={clearPreview}
              disabled={isProcessing}
            >
              <X className="h-4 w-4" />
            </Button>
            {isProcessing && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Extracting text...
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full h-24 border-dashed flex flex-col gap-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isProcessing}
        >
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            <Upload className="h-4 w-4" />
          </div>
          <span className="text-sm text-muted-foreground">
            Upload screenshot for OCR
          </span>
        </Button>
      )}
    </div>
  );
}
