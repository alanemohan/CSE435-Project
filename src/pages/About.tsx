import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
  Shield,
  Target,
  Users,
  Zap,
  Lock,
  Globe,
  Heart,
  Award,
  ArrowRight,
  MessageSquareWarning,
  Briefcase,
  FileText,
  ShieldAlert,
  Mail,
   CheckCircle,
   Star,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
 import PublicNavbar from '@/components/layout/PublicNavbar';
 import PublicFooter from '@/components/layout/PublicFooter';

export default function About() {
  const { user } = useAuth();

  const missionPoints = [
    {
      icon: Shield,
      title: 'Protect Citizens',
      description: 'Empower individuals with AI-powered tools to identify and avoid digital scams.',
    },
    {
      icon: Target,
      title: 'Stay Ahead of Scammers',
      description: 'Use cutting-edge AI to detect evolving scam patterns and tactics.',
    },
    {
      icon: Users,
      title: 'Community-Driven Safety',
      description: 'Crowd-sourced pattern learning to protect the entire community.',
    },
  ];

  const features = [
    {
      icon: MessageSquareWarning,
      title: 'Scam Message Analyzer',
      description: 'AI-powered detection of fraudulent SMS, WhatsApp, email messages with OCR support for screenshots.',
    },
    {
      icon: Briefcase,
      title: 'Job Offer Verification',
      description: 'Identify fake job offers, unrealistic salary promises, and employment scam patterns.',
    },
    {
      icon: FileText,
      title: 'Complaint Generator',
      description: 'Generate formal complaints with proper legal language, status tracking, and authority finder.',
    },
    {
      icon: ShieldAlert,
      title: 'Vulnerability Profile',
      description: 'Personalized safety insights based on your analysis history and risk patterns.',
    },
    {
      icon: Globe,
      title: 'Regional Language Support',
      description: 'Translate analysis results into major Indian languages including Hindi, Tamil, Telugu, and more.',
    },
    {
      icon: Lock,
      title: 'Privacy-First Approach',
      description: 'Hash-based pattern matching ensures your personal data is never stored.',
    },
  ];

  const stats = [
    { value: '10K+', label: 'Scams Detected' },
    { value: '98%', label: 'Accuracy Rate' },
    { value: '50K+', label: 'Users Protected' },
    { value: '8+', label: 'Languages Supported' },
  ];

  const values = [
    {
      icon: Heart,
      title: 'User-First',
      description: 'Every feature is designed with user safety and privacy as the top priority.',
    },
    {
      icon: Zap,
      title: 'Innovation',
      description: 'Leveraging the latest AI technology to stay ahead of evolving threats.',
    },
    {
      icon: Award,
      title: 'Excellence',
      description: 'Committed to providing the most accurate and reliable scam detection.',
    },
  ];

  // If user is logged in, show with dashboard layout
  if (user) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-12 animate-fade-in">
          {/* Header */}
           <section className="relative overflow-hidden rounded-2xl border border-primary/20 p-8 md:p-12" style={{ background: 'var(--gradient-hero)' }}>
            <div
              aria-hidden
               className="pointer-events-none absolute inset-0"
            />
             <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
             <div className="absolute bottom-0 left-0 w-48 h-48 bg-success/10 rounded-full blur-3xl" />
            <div className="relative z-10 text-center">
               <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20">
                <Shield className="h-4 w-4" />
                About CivicShield
              </div>
               <h1 className="text-3xl md:text-4xl font-display font-bold mb-4 gradient-text">
                Protecting Citizens in the Digital Age
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                CivicShield is an AI-powered platform designed to protect Indian citizens from digital scams,
                fraudulent job offers, and cyber threats.
              </p>
            </div>
          </section>

          {/* Mission */}
           <div className="glass-card rounded-2xl p-8 border-primary/20">
            <h2 className="text-2xl font-display font-semibold mb-6 text-center">Our Mission</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {missionPoints.map((point, i) => (
                 <div key={i} className="text-center p-4 rounded-xl hover:bg-secondary/30 transition-colors">
                   <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <point.icon className="h-6 w-6 text-primary" />
                  </div>
                   <h3 className="font-display font-semibold mb-2">{point.title}</h3>
                  <p className="text-sm text-muted-foreground">{point.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
               <div key={i} className="glass-card rounded-xl p-6 text-center hover:border-primary/30 transition-all hover:-translate-y-1">
                 <p className="text-3xl md:text-4xl font-display font-bold gradient-text">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Features */}
          <div>
             <h2 className="text-2xl font-display font-semibold mb-8 text-center">Our Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, i) => (
                 <div key={i} className="glass-card rounded-xl p-6 hover:border-primary/30 transition-all hover:-translate-y-0.5 group">
                  <div className="flex items-start gap-4">
                     <div className="p-3 rounded-xl bg-primary/10 shrink-0 group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                       <h3 className="font-display font-semibold mb-1 group-hover:text-primary transition-colors">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Values */}
           <div className="glass-card rounded-2xl p-8 border-success/20">
            <h2 className="text-2xl font-display font-semibold mb-6 text-center">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {values.map((value, i) => (
                 <div key={i} className="text-center p-4 rounded-xl hover:bg-secondary/30 transition-colors">
                   <div className="w-14 h-14 rounded-xl bg-success/10 flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-6 w-6 text-success" />
                  </div>
                   <h3 className="font-display font-semibold mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
           <div className="glass-card rounded-2xl p-8 text-center border-primary/20">
             <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 glow-primary">
               <Mail className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-display font-semibold mb-2">Get in Touch</h2>
             <p className="text-muted-foreground mb-6">
              Have questions or feedback? We'd love to hear from you.
            </p>
             <a href="mailto:support@civicshield.in" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors">
               <Mail className="h-4 w-4" />
               support@civicshield.in
             </a>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Public version without dashboard layout
  return (
    <div className="min-h-screen" style={{ background: 'var(--gradient-hero)' }}>
       <PublicNavbar />

       <div className="container mx-auto px-4 py-16 md:py-24 space-y-20">
        {/* Header */}
         <div className="text-center max-w-3xl mx-auto relative">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
           <div className="relative z-10">
             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20">
               <Shield className="h-4 w-4" />
               About CivicShield
             </div>
             <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
               Protecting Citizens in the{' '}
               <span className="gradient-text">Digital Age</span>
             </h1>
             <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
               CivicShield is an AI-powered platform designed to protect Indian citizens from digital scams, 
               fraudulent job offers, and cyber threats.
             </p>
          </div>
        </div>

        {/* Mission */}
         <div className="glass-card rounded-3xl p-10 md:p-12 max-w-4xl mx-auto border-primary/20">
           <div className="text-center mb-10">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-medium mb-4">
               <Target className="h-3 w-3" />
               OUR MISSION
             </div>
             <h2 className="text-2xl md:text-3xl font-display font-bold">Why We Exist</h2>
           </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {missionPoints.map((point, i) => (
               <div key={i} className="text-center p-4 rounded-xl hover:bg-secondary/30 transition-colors">
                 <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                   <point.icon className="h-8 w-8 text-primary" />
                </div>
                 <h3 className="font-display font-semibold text-lg mb-2">{point.title}</h3>
                 <p className="text-muted-foreground text-sm">{point.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
         <div className="py-12 bg-card/50 backdrop-blur-sm rounded-3xl border border-border/50">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto px-6">
            {stats.map((stat, i) => (
               <div key={i} className="text-center group">
                 <p className="text-4xl md:text-5xl font-display font-bold gradient-text group-hover:scale-110 transition-transform">{stat.value}</p>
                <p className="text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="max-w-4xl mx-auto">
           <div className="text-center mb-10">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-warning/10 text-warning text-xs font-medium mb-4">
               <Star className="h-3 w-3" />
               FEATURES
             </div>
             <h2 className="text-2xl md:text-3xl font-display font-bold">Comprehensive Protection</h2>
           </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, i) => (
               <div key={i} className="glass-card rounded-2xl p-6 hover:border-primary/30 transition-all hover:-translate-y-1 group">
                <div className="flex items-start gap-4">
                   <div className="p-3 rounded-xl bg-primary/10 shrink-0 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                     <h3 className="font-display font-semibold mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

         {/* Values */}
         <div className="max-w-4xl mx-auto glass-card rounded-3xl p-10 md:p-12 border-success/20">
           <div className="text-center mb-10">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-medium mb-4">
               <CheckCircle className="h-3 w-3" />
               OUR VALUES
             </div>
             <h2 className="text-2xl md:text-3xl font-display font-bold">What We Stand For</h2>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {values.map((value, i) => (
               <div key={i} className="text-center p-4 rounded-xl hover:bg-secondary/30 transition-colors">
                 <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
                   <value.icon className="h-8 w-8 text-success" />
                 </div>
                 <h3 className="font-display font-semibold text-lg mb-2">{value.title}</h3>
                 <p className="text-muted-foreground text-sm">{value.description}</p>
               </div>
             ))}
           </div>
         </div>
 
        {/* CTA */}
         <div className="text-center max-w-2xl mx-auto glass-card rounded-3xl p-12 border-primary/20">
           <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 glow-primary">
             <Shield className="h-10 w-10 text-primary" />
           </div>
           <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
            Start Your Protection Today
          </h2>
          <p className="text-muted-foreground mb-6">
            Join thousands of citizens who trust CivicShield for their digital safety.
          </p>
           <Button size="lg" asChild className="glow-primary px-10">
            <Link to="/auth">
              Get Started for Free
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </Button>
           <p className="text-xs text-muted-foreground mt-4">No credit card required • Free forever</p>
        </div>
      </div>

       <PublicFooter />
    </div>
  );
}
