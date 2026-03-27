import { useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface ImageUploaderProps {
  onTextExtracted: (text: string) => void;
  disabled?: boolean;
}

export default function ImageUploader({ onTextExtracted, disabled }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.replace(/\.[^/.]+$/, '');
    onTextExtracted(fileName);

    toast({
      title: 'Image added',
      description: 'Image uploaded. Manual OCR extraction can be added later.',
    });

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        title="Upload screenshot"
        aria-label="Upload screenshot"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className="w-full"
      >
        <Upload className="h-4 w-4 mr-2" />
        Upload Screenshot
      </Button>
    </div>
  );
}
