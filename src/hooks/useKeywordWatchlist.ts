import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface KeywordItem {
  id: string;
  user_id: string;
  keyword: string;
  created_at: string;
}

export function useKeywordWatchlist() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['keyword-watchlist', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('keyword_watchlist')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as KeywordItem[];
    },
    enabled: !!user,
  });
}

export function useAddKeyword() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keyword: string) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('keyword_watchlist')
        .insert({
          user_id: user.id,
          keyword: keyword.toLowerCase().trim(),
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('This keyword is already in your watchlist');
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keyword-watchlist'] });
    },
  });
}

export function useDeleteKeyword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('keyword_watchlist')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keyword-watchlist'] });
    },
  });
}
