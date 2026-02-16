import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useAlertCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['alert-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('community_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('severity', 'high');

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 60000, // Refresh every minute
  });
}
