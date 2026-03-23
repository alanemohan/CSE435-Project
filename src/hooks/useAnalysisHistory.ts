import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';

type AnalysisInsert = Omit<TablesInsert<'analysis_history'>, 'user_id'>;

export function useSaveAnalysis() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: AnalysisInsert) => {
      if (!user) {
        throw new Error('You must be signed in to save analysis history.');
      }

      const { data, error } = await supabase
        .from('analysis_history')
        .insert({ ...payload, user_id: user.id })
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
  });
}
