import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useKeywordWatchlist, useAddKeyword, useDeleteKeyword } from '@/hooks/useKeywordWatchlist';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tag,
  Plus,
  X,
  AlertTriangle,
  Shield,
  Info,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const SUGGESTED_KEYWORDS = [
  'KYC',
  'Courier',
  'Refund',
  'Internship Fee',
  'Registration Fee',
  'Lottery',
  'Prize',
  'Urgent',
  'Blocked',
  'Suspended',
  'OTP',
  'Bank',
  'ATM',
  'Credit Card',
  'Loan Approved',
];

export default function Watchlist() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: keywords, isLoading } = useKeywordWatchlist();
  const addKeyword = useAddKeyword();
  const deleteKeyword = useDeleteKeyword();

  const [newKeyword, setNewKeyword] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleAddKeyword = async (keyword: string) => {
    if (!keyword.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a keyword.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await addKeyword.mutateAsync(keyword);
      setNewKeyword('');
      toast({
        title: 'Keyword Added',
        description: `"${keyword}" has been added to your watchlist.`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to add keyword.';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteKeyword = async (id: string, keyword: string) => {
    try {
      await deleteKeyword.mutateAsync(id);
      toast({
        title: 'Keyword Removed',
        description: `"${keyword}" has been removed from your watchlist.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove keyword.',
        variant: 'destructive',
      });
    }
  };

  const existingKeywords = keywords?.map((k) => k.keyword.toLowerCase()) || [];

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner size="lg" text="Loading watchlist..." />
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
            <div className="p-2 rounded-lg bg-warning/10">
              <Tag className="h-6 w-6 text-warning" />
            </div>
            <h1 className="text-2xl font-display font-bold">Alert Keyword Watchlist</h1>
          </div>
          <p className="text-muted-foreground">
            Add keywords that will trigger automatic high-risk alerts when detected in messages.
          </p>
        </div>

        {/* Info Card */}
        <div className="glass-card rounded-xl p-4 border-primary/50">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-sm">How it works</h3>
              <p className="text-sm text-muted-foreground mt-1">
                When you analyze a message, any keyword from your watchlist found in the message will automatically flag it as higher risk. This helps you catch scam patterns specific to your situation.
              </p>
            </div>
          </div>
        </div>

        {/* Add Keyword Section */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-display font-semibold mb-4">Add New Keyword</h3>
          <div className="flex gap-3">
            <Input
              placeholder="Enter a keyword or phrase..."
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword(newKeyword)}
              className="flex-1 bg-secondary/50"
            />
            <Button
              onClick={() => handleAddKeyword(newKeyword)}
              disabled={addKeyword.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {addKeyword.isPending ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Suggested Keywords */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-display font-semibold mb-4">Suggested Keywords</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Common scam-related terms you might want to track:
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_KEYWORDS.map((keyword) => {
              const isAdded = existingKeywords.includes(keyword.toLowerCase());
              return (
                <button
                  key={keyword}
                  onClick={() => !isAdded && handleAddKeyword(keyword)}
                  disabled={isAdded || addKeyword.isPending}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    isAdded
                      ? 'bg-success/10 text-success cursor-default'
                      : 'bg-secondary hover:bg-primary/10 hover:text-primary cursor-pointer'
                  }`}
                >
                  {isAdded ? (
                    <span className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {keyword}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Plus className="h-3 w-3" />
                      {keyword}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Watchlist */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Your Watchlist ({keywords?.length || 0})
          </h3>

          {keywords && keywords.length > 0 ? (
            <div className="space-y-2">
              {keywords.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Tag className="h-4 w-4 text-warning" />
                    <span className="font-medium">{item.keyword}</span>
                    <span className="text-xs text-muted-foreground">
                      Added {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteKeyword(item.id, item.keyword)}
                    disabled={deleteKeyword.isPending}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Tag className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No keywords in your watchlist yet.</p>
              <p className="text-sm">Add keywords above to start tracking.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
