import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription, useUpgradePlan, PLAN_DETAILS } from '@/hooks/useSubscription';
import PublicNavbar from '@/components/layout/PublicNavbar';
import PublicFooter from '@/components/layout/PublicFooter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Zap, Building2, Rocket, Crown, ArrowRight, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const planIcons = {
  free: Shield,
  premium: Zap,
  enterprise: Building2,
};

const planColors = {
  free: 'border-border',
  premium: 'border-primary ring-2 ring-primary/20',
  enterprise: 'border-accent',
};

export default function Pricing() {
  const { user } = useAuth();
  const { plan: currentPlan, isPremium } = useSubscription();
  const upgradePlan = useUpgradePlan();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const handleSelectPlan = async (plan: 'free' | 'premium' | 'enterprise') => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (plan === currentPlan) return;

    if (plan === 'enterprise') {
      toast({
        title: 'Enterprise Plan',
        description: 'Contact our sales team at enterprise@civicshield.com for custom pricing.',
      });
      return;
    }

    try {
      await upgradePlan.mutateAsync(plan);
      toast({
        title: '🎉 Plan Updated!',
        description: `You're now on the ${PLAN_DETAILS[plan].name} plan.`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update plan. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getPrice = (plan: keyof typeof PLAN_DETAILS) => {
    const base = PLAN_DETAILS[plan].price;
    if (billingCycle === 'yearly') return Math.round(base * 10); // 2 months free
    return base;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 lg:py-24 text-center">
          <div className="container mx-auto px-4 max-w-4xl">
            <Badge variant="secondary" className="mb-4">
              <Crown className="h-3 w-3 mr-1" />
              Simple, transparent pricing
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-display font-bold mb-4">
              Choose the plan that{' '}
              <span className="gradient-text">protects you best</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Start free, upgrade when you need more power. All plans include our core scam detection technology.
            </p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-3 bg-secondary/50 rounded-full p-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all',
                  billingCycle === 'monthly'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all',
                  billingCycle === 'yearly'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Yearly
                <Badge variant="outline" className="ml-2 text-xs bg-green-500/10 text-green-500 border-green-500/20">
                  Save 17%
                </Badge>
              </button>
            </div>
          </div>
        </section>

        {/* Plans */}
        <section className="pb-16 lg:pb-24">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {(Object.keys(PLAN_DETAILS) as Array<keyof typeof PLAN_DETAILS>).map((planKey) => {
                const details = PLAN_DETAILS[planKey];
                const Icon = planIcons[planKey];
                const isCurrentPlan = user && currentPlan === planKey;
                const isPopular = planKey === 'premium';
                const price = getPrice(planKey);

                return (
                  <Card
                    key={planKey}
                    className={cn(
                      'relative flex flex-col transition-all duration-300 hover:shadow-lg',
                      planColors[planKey],
                      isPopular && 'scale-[1.02] lg:scale-105'
                    )}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground shadow-lg">
                          <Rocket className="h-3 w-3 mr-1" />
                          Most Popular
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={cn(
                          'p-2 rounded-lg',
                          isPopular ? 'bg-primary/10' : 'bg-secondary'
                        )}>
                          <Icon className={cn('h-5 w-5', isPopular ? 'text-primary' : 'text-muted-foreground')} />
                        </div>
                        <CardTitle className="text-xl">{details.name}</CardTitle>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">
                          {price === 0 ? 'Free' : `₹${price}`}
                        </span>
                        {price > 0 && (
                          <span className="text-muted-foreground">
                            /{billingCycle === 'yearly' ? 'year' : 'month'}
                          </span>
                        )}
                      </div>
                      <CardDescription>
                        {planKey === 'free' && 'Get started with basic protection'}
                        {planKey === 'premium' && 'Full protection for individuals'}
                        {planKey === 'enterprise' && 'For teams and organizations'}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="flex-1 space-y-3">
                      {details.features.map((feature) => (
                        <div key={feature} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                      {details.notIncluded.map((feature) => (
                        <div key={feature} className="flex items-start gap-2 opacity-40">
                          <X className="h-4 w-4 mt-0.5 shrink-0" />
                          <span className="text-sm line-through">{feature}</span>
                        </div>
                      ))}
                    </CardContent>

                    <CardFooter>
                      <Button
                        className="w-full"
                        variant={isPopular ? 'default' : 'outline'}
                        size="lg"
                        disabled={!!isCurrentPlan || upgradePlan.isPending}
                        onClick={() => handleSelectPlan(planKey)}
                      >
                        {isCurrentPlan ? (
                          'Current Plan'
                        ) : planKey === 'enterprise' ? (
                          <>Contact Sales</>
                        ) : (
                          <>
                            {planKey === 'free' ? 'Get Started' : 'Upgrade Now'}
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-2xl font-display font-bold text-center mb-8">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                { q: 'Can I change plans anytime?', a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.' },
                { q: 'What happens when I reach my scan limit?', a: 'You\'ll be notified when approaching your limit. Upgrade to Premium for more scans or wait for the monthly reset.' },
                { q: 'Is there a refund policy?', a: 'We offer a 14-day money-back guarantee on all paid plans. No questions asked.' },
                { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, UPI, and net banking. Enterprise plans support invoicing.' },
              ].map((faq) => (
                <Card key={faq.q} className="bg-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{faq.q}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{faq.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
