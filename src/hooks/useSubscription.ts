import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserSubscription {
  id: string;
  user_id: string;
  plan: 'free' | 'premium' | 'enterprise';
  scans_used: number;
  scans_limit: number;
  features: string[];
  started_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export const PLAN_DETAILS = {
  free: {
    name: 'Free',
    price: 0,
    scansLimit: 5,
    features: [
      'Basic scam analysis',
      'Job listing checker',
      'Community alerts (view only)',
      '5 scans per month',
    ],
    notIncluded: [
      'Advanced AI analysis',
      'Complaint generator',
      'Evidence vault',
      'Vulnerability profile',
      'Priority support',
      'API access',
    ],
  },
  premium: {
    name: 'Premium',
    price: 299,
    scansLimit: 100,
    features: [
      'Everything in Free',
      'Unlimited scam analysis',
      'Advanced AI-powered detection',
      'Complaint generator',
      'Evidence vault',
      'Vulnerability profile',
      'Report templates',
      'Priority email support',
      '100 scans per month',
    ],
    notIncluded: [
      'API access',
      'Team management',
      'Bulk analysis',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: 2999,
    scansLimit: 10000,
    features: [
      'Everything in Premium',
      'Bulk scam analysis API',
      'Admin dashboard',
      'Multi-user team access',
      'Fraud analytics & trends',
      'Custom integrations',
      'Dedicated account manager',
      '10,000 scans per month',
      'SLA guarantee',
    ],
    notIncluded: [],
  },
} as const;

export const PREMIUM_FEATURES = [
  '/complaint-generator',
  '/evidence-vault',
  '/vulnerability-analysis',
];

export function useSubscription() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      // Auto-create free subscription if none exists
      if (!data) {
        const { data: newSub, error: insertErr } = await supabase
          .from('user_subscriptions')
          .insert({ user_id: user.id, plan: 'free', scans_limit: 5 })
          .select()
          .single();
        if (insertErr) throw insertErr;
        return newSub as unknown as UserSubscription;
      }

      return data as unknown as UserSubscription;
    },
    enabled: !!user,
  });

  const plan = (query.data?.plan || 'free') as keyof typeof PLAN_DETAILS;
  const scansUsed = query.data?.scans_used || 0;
  const scansLimit = query.data?.scans_limit || 5;
  const canScan = scansUsed < scansLimit;
  const isPremium = plan === 'premium' || plan === 'enterprise';
  const isEnterprise = plan === 'enterprise';

  return {
    ...query,
    subscription: query.data,
    plan,
    scansUsed,
    scansLimit,
    canScan,
    isPremium,
    isEnterprise,
  };
}

export function useIncrementScanCount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data: current } = await supabase
        .from('user_subscriptions')
        .select('scans_used')
        .eq('user_id', user.id)
        .single();

      const { error } = await supabase
        .from('user_subscriptions')
        .update({ scans_used: (current?.scans_used || 0) + 1 })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });
}

export function useUpgradePlan() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (plan: 'free' | 'premium' | 'enterprise') => {
      if (!user) throw new Error('Not authenticated');

      const limits = { free: 5, premium: 100, enterprise: 10000 };

      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          plan,
          scans_limit: limits[plan],
          scans_used: 0,
          started_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });
}
