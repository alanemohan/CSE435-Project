import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Json } from '@/integrations/supabase/types';

export interface AnalysisHistoryItem {
  id: string;
  user_id: string;
  analysis_type: 'scam' | 'job' | 'complaint';
  input_text: string;
  ai_result: Record<string, unknown>;
  risk_score: number | null;
  category: string | null;
  created_at: string;
}

export function useAnalysisHistory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['analysis-history', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('analysis_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AnalysisHistoryItem[];
    },
    enabled: !!user,
  });
}

export function useSaveAnalysis() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (analysis: {
      analysis_type: 'scam' | 'job' | 'complaint';
      input_text: string;
      ai_result: Record<string, unknown>;
      risk_score?: number;
      category?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('analysis_history')
        .insert({
          user_id: user.id,
          analysis_type: analysis.analysis_type,
          input_text: analysis.input_text,
          ai_result: analysis.ai_result as Json,
          risk_score: analysis.risk_score ?? null,
          category: analysis.category ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analysis-history'] });
    },
  });
}

export function useDeleteAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('analysis_history')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analysis-history'] });
    },
  });
}
