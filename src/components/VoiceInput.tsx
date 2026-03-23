import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  onstart: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export default function VoiceInput({ onTranscript, disabled, className }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [interimTranscript, setInterimTranscript] = useState('');
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      console.log('Speech Recognition API not supported');
      setIsSupported(false);
      return;
    }

    try {
      const recognitionInstance = new SpeechRecognitionAPI();
      recognitionInstance.continuous = false; // Changed to false for better reliability
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-IN'; // Indian English

      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let interim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interim += transcript;
          }
        }

        setInterimTranscript(interim);

        if (finalTranscript) {
          onTranscriptRef.current(finalTranscript);
          setInterimTranscript('');
        }
      };

      recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        if (event.error === 'not-allowed') {
          toast({
            title: 'Microphone Access Denied',
            description: 'Please allow microphone access in your browser settings.',
            variant: 'destructive',
          });
        } else if (event.error === 'network') {
          toast({
            title: 'Voice Input Error (network)',
            description:
              'Your browser could not reach the speech recognition service. Try reloading the page, disabling VPN/ad-block, or using Chrome/Edge on desktop.',
            variant: 'destructive',
          });
        } else if (event.error === 'no-speech') {
          toast({
            title: 'No Speech Detected',
            description: 'Please speak clearly into your microphone.',
            variant: 'destructive',
          });
        } else if (event.error !== 'aborted') {
          toast({
            title: 'Voice Input Error',
            description: `Error: ${event.error}. Please try again.`,
            variant: 'destructive',
          });
        }
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionInstance.onstart = () => {
        setIsListening(true);
      };

      setRecognition(recognitionInstance);

      return () => {
        try {
          recognitionInstance.abort();
        } catch (e) {
          // Ignore abort errors
        }
      };
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error);
      setIsSupported(false);
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (disabled) return;

    if (!recognition) {
      toast({
        title: 'Voice Input Unavailable',
        description: 'Speech recognition is not supported in this browser. Try Chrome or Edge.',
        variant: 'destructive',
      });
      return;
    }

    if (isListening) {
      try {
        recognition.stop();
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
    } else {
      try {
        // IMPORTANT: start() must run directly in the user gesture handler (no setTimeout),
        // otherwise some browsers throw errors like "network" / "not-allowed".
        recognition.start();
        toast({
          title: '🎤 Listening...',
          description: 'Speak clearly into your microphone.',
        });
      } catch (error: unknown) {
        console.error('Failed to start recognition:', error);

        // Try one recovery path for InvalidStateError (already started / stuck)
        try {
          recognition.stop();
        } catch {
          // ignore
        }

        try {
          recognition.start();
          toast({
            title: '🎤 Listening...',
            description: 'Speak clearly into your microphone.',
          });
        } catch (error2) {
          console.error('Failed to restart recognition:', error2);
          toast({
            title: 'Could not start voice input',
            description: 'Please check microphone permissions and try again.',
            variant: 'destructive',
          });
        }
      }
    }
  }, [recognition, isListening, disabled]);

  if (!isSupported) {
    return (
      <Button
        variant="outline"
        size="icon"
        disabled
        className={className}
        title="Voice input not supported in this browser"
      >
        <MicOff className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button
        variant={isListening ? 'destructive' : 'outline'}
        size="icon"
        onClick={toggleListening}
        disabled={disabled}
        className={`relative ${className} ${isListening ? 'animate-pulse' : ''}`}
        title={isListening ? 'Stop listening' : 'Start voice input'}
      >
        {isListening ? (
          <div className="relative">
            <Mic className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-danger rounded-full animate-ping" />
          </div>
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>

      {interimTranscript && (
        <div className="absolute top-full mt-2 left-0 right-0 min-w-[200px] p-2 bg-card border border-border rounded-lg shadow-lg z-10">
          <div className="flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground italic">{interimTranscript}</span>
          </div>
        </div>
      )}
    </div>
  );
}
