import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  ExternalLink, 
  Loader2, 
  Phone, 
  FileText, 
  Clock,
  ChevronDown,
  ChevronUp 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AuthorityInfo {
  primaryAuthority: {
    name: string;
    portal: string;
    portalName: string;
    description: string;
  };
  alternativeAuthorities: Array<{
    name: string;
    portal: string;
    portalName: string;
    description: string;
  }>;
  filingSteps: string[];
  documentsRequired: string[];
  expectedTimeline: string;
  escalationPath: string;
  helplineNumbers: string[];
}

interface AuthorityFinderProps {
  category: string;
  description: string;
  location?: string;
}

export default function AuthorityFinder({ category, description, location }: AuthorityFinderProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [authorityInfo, setAuthorityInfo] = useState<AuthorityInfo | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleFindAuthority = async () => {
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('find-authority', {
        body: { category, description, location },
      });

      if (error) throw error;

      setAuthorityInfo(data);
      setShowDetails(true);

      toast({
        title: 'Authority Found',
        description: `Recommended: ${data.primaryAuthority.name}`,
      });
    } catch (error) {
      console.error('Authority finder error:', error);
      toast({
        title: 'Search Failed',
        description: 'Could not find authority information. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  if (!authorityInfo) {
    return (
      <Button
        variant="outline"
        onClick={handleFindAuthority}
        disabled={isSearching || !description}
        className="w-full"
      >
        {isSearching ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Finding Authority...
          </>
        ) : (
          <>
            <Building2 className="h-4 w-4 mr-2" />
            Find Appropriate Authority
          </>
        )}
      </Button>
    );
  }

  return (
    <div className="glass-card rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Recommended Authority
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Primary Authority */}
      <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold">{authorityInfo.primaryAuthority.name}</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {authorityInfo.primaryAuthority.description}
            </p>
          </div>
          <a
            href={authorityInfo.primaryAuthority.portal}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
          >
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-1" />
              Visit Portal
            </Button>
          </a>
        </div>
        <Badge variant="secondary" className="mt-2">
          {authorityInfo.primaryAuthority.portalName}
        </Badge>
      </div>

      {showDetails && (
        <>
          {/* Expected Timeline */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/30">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              <strong>Expected Response:</strong> {authorityInfo.expectedTimeline}
            </span>
          </div>

          {/* Filing Steps */}
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Filing Steps
            </h4>
            <ol className="space-y-2">
              {authorityInfo.filingSteps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Documents Required */}
          <div>
            <h4 className="font-medium mb-2">Documents Required</h4>
            <div className="flex flex-wrap gap-2">
              {authorityInfo.documentsRequired.map((doc, i) => (
                <Badge key={i} variant="outline">{doc}</Badge>
              ))}
            </div>
          </div>

          {/* Helpline Numbers */}
          {authorityInfo.helplineNumbers.length > 0 && (
            <div className="p-3 rounded-lg bg-success/5 border border-success/20">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Phone className="h-4 w-4 text-success" />
                Helpline Numbers
              </h4>
              <div className="flex flex-wrap gap-2">
                {authorityInfo.helplineNumbers.map((number, i) => (
                  <a
                    key={i}
                    href={`tel:${number}`}
                    className="px-3 py-1 rounded-full bg-success/10 text-success text-sm font-medium hover:bg-success/20 transition-colors"
                  >
                    {number}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Alternative Authorities */}
          {authorityInfo.alternativeAuthorities.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Alternative Authorities</h4>
              <div className="space-y-2">
                {authorityInfo.alternativeAuthorities.map((auth, i) => (
                  <div key={i} className="p-3 rounded-lg bg-secondary/30">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{auth.name}</span>
                      <a
                        href={auth.portal}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary text-sm hover:underline"
                      >
                        {auth.portalName}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Escalation Path */}
          <p className="text-xs text-muted-foreground">
            <strong>Escalation:</strong> {authorityInfo.escalationPath}
          </p>
        </>
      )}
    </div>
  );
}
