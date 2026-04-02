 import { Link } from 'react-router-dom';
 import { Button } from '@/components/ui/button';
 import {
   Shield,
   MessageSquareWarning,
   Briefcase,
   FileText,
   ChevronRight,
   Users,
   Zap,
   Lock,
   ArrowRight,
   Star,
   TrendingUp,
   AlertTriangle,
 } from 'lucide-react';
 import PublicNavbar from '@/components/layout/PublicNavbar';
 import PublicFooter from '@/components/layout/PublicFooter';
 
 export default function Index() {
   const features = [
    {
      icon: MessageSquareWarning,
      title: 'Scam Message Analyzer',
      description: 'AI-powered detection of fraudulent SMS, WhatsApp, and email messages with risk scoring.',
      color: 'from-danger/20 to-danger/5',
       iconColor: 'text-danger',
       borderColor: 'hover:border-danger/30',
    },
    {
      icon: Briefcase,
      title: 'Job Offer Verification',
      description: 'Identify fake job offers, unrealistic salary promises, and employment scam patterns.',
      color: 'from-warning/20 to-warning/5',
       iconColor: 'text-warning',
       borderColor: 'hover:border-warning/30',
    },
    {
      icon: FileText,
      title: 'Complaint Generator',
      description: 'Generate formal complaints with proper legal language for various authorities.',
      color: 'from-primary/20 to-primary/5',
       iconColor: 'text-primary',
       borderColor: 'hover:border-primary/30',
    },
  ];

  const stats = [
    { value: '10K+', label: 'Scams Detected' },
    { value: '98%', label: 'Accuracy Rate' },
    { value: '50K+', label: 'Users Protected' },
    { value: '24/7', label: 'AI Protection' },
  ];

  const benefits = [
    { icon: Zap, text: 'Instant AI analysis in seconds' },
    { icon: Lock, text: 'Your data stays private and secure' },
     { icon: Users, text: 'Community-powered threat detection' },
   ];
 
   const testimonials = [
     {
       text: 'CivicShield saved me from a ₹50,000 job scam. The AI detected red flags I would have missed.',
       author: 'Priya S.',
       location: 'Mumbai',
       rating: 5,
     },
     {
       text: 'The complaint generator helped me file a proper report. Got my money back within 3 weeks!',
       author: 'Rahul M.',
       location: 'Delhi',
       rating: 5,
     },
     {
       text: 'Every Indian should use this. The scam detection is incredibly accurate and fast.',
       author: 'Anita K.',
       location: 'Bangalore',
       rating: 5,
     },
   ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--gradient-hero)' }}>
       <PublicNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
           <div className="absolute bottom-20 right-10 w-96 h-96 bg-success/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in border border-primary/20">
              <Shield className="h-4 w-4" />
               AI-Powered Citizen Protection
               <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-6 animate-slide-up">
              Stay Protected from{' '}
              <span className="gradient-text">Digital Scams</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              CivicShield uses advanced AI to analyze suspicious messages, verify job offers, and generate formal complaints — keeping you safe in the digital world.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Button size="lg" asChild className="text-lg px-8 glow-primary">
                <Link to="/auth">
                  Start Protecting Yourself
                  <ChevronRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
               <Button size="lg" variant="outline" asChild className="text-lg px-8">
                 <Link to="/about">Learn More</Link>
              </Button>
               </div>
 
             {/* Trust Indicators */}
             <div className="flex flex-wrap items-center justify-center gap-6 mt-12 animate-fade-in" style={{ animationDelay: '0.3s' }}>
               <div className="flex items-center gap-2 text-sm text-muted-foreground">
                 <div className="flex -space-x-1">
                   {[...Array(4)].map((_, i) => (
                     <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-background" />
                   ))}
                 </div>
                 <span>50K+ protected users</span>
               </div>
               <div className="flex items-center gap-1">
                 {[...Array(5)].map((_, i) => (
                   <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                 ))}
                 <span className="text-sm text-muted-foreground ml-1">4.9/5 rating</span>
               </div>
             </div>
          </div>
        </div>
      </section>

       {/* Stats Section */}
       <section className="py-16 border-y border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
             {stats.map((stat, i) => (
               <div key={i} className="text-center group">
                 <p className="text-3xl md:text-5xl font-display font-bold gradient-text group-hover:scale-110 transition-transform">{stat.value}</p>
                <p className="text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

       {/* Features Section */}
       <section className="py-20 md:py-32">
         <div className="container mx-auto px-4">
           <div className="text-center mb-16">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-medium mb-4">
               <TrendingUp className="h-3 w-3" />
               CORE FEATURES
             </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Comprehensive Protection Suite
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to stay safe from digital threats and civic issues.
            </p>
          </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {features.map((feature, i) => (
               <div
                 key={i}
                 className={`glass-card rounded-2xl p-8 ${feature.borderColor} transition-all group hover:-translate-y-1`}
               >
                 <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`h-7 w-7 ${feature.iconColor}`} />
                </div>
                <h3 className="text-xl font-display font-semibold mb-3 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                 <p className="text-muted-foreground">{feature.description}</p>
                 <ArrowRight className="h-5 w-5 mt-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-2 transition-all" />
              </div>
            ))}
          </div>
        </div>
      </section>

       {/* Testimonials Section */}
       <section className="py-20 bg-card/30 backdrop-blur-sm border-y border-border/50">
         <div className="container mx-auto px-4">
           <div className="text-center mb-12">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-warning/10 text-warning text-xs font-medium mb-4">
               <Users className="h-3 w-3" />
               TESTIMONIALS
             </div>
             <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
               Trusted by Thousands
             </h2>
             <p className="text-muted-foreground max-w-xl mx-auto">
               Real stories from people we've helped protect
             </p>
           </div>
 
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
             {testimonials.map((testimonial, i) => (
               <div key={i} className="glass-card rounded-2xl p-6 hover:border-primary/30 transition-all">
                 <div className="flex items-center gap-1 mb-4">
                   {[...Array(testimonial.rating)].map((_, j) => (
                     <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                   ))}
                 </div>
                 <p className="text-foreground mb-4 leading-relaxed">"{testimonial.text}"</p>
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                     <span className="text-sm font-bold text-primary">{testimonial.author[0]}</span>
                   </div>
                   <div>
                     <p className="font-medium text-sm">{testimonial.author}</p>
                     <p className="text-xs text-muted-foreground">{testimonial.location}</p>
                   </div>
                 </div>
               </div>
             ))}
           </div>
         </div>
       </section>
 
       {/* Benefits Section */}
       <section className="py-20 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
                  Why Choose CivicShield?
                </h2>
                <div className="space-y-4">
                   {benefits.map((benefit, i) => (
                     <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                       <div className="p-3 rounded-lg bg-primary/10">
                         <benefit.icon className="h-6 w-6 text-primary" />
                      </div>
                       <span className="text-lg font-medium">{benefit.text}</span>
                    </div>
                  ))}
                </div>
              </div>

               <div className="glass-card rounded-2xl p-8 border-success/30">
                 <div className="text-center space-y-4">
                   <div className="w-24 h-24 rounded-full bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center mx-auto glow-success">
                     <Shield className="h-12 w-12 text-success" />
                  </div>
                   <div>
                     <h3 className="text-2xl font-display font-semibold">Protected Status</h3>
                     <p className="text-muted-foreground mt-2">
                       Join thousands of citizens who trust CivicShield for their digital safety.
                     </p>
                   </div>
                   <Button asChild className="w-full glow-primary" size="lg">
                    <Link to="/auth">
                      Create Free Account
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                   </Button>
                   <p className="text-xs text-muted-foreground">No credit card required • Free forever</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

       {/* Alert Banner */}
       <section className="py-8 bg-danger/10 border-y border-danger/30">
         <div className="container mx-auto px-4">
           <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center">
             <div className="flex items-center gap-2 text-danger">
               <AlertTriangle className="h-5 w-5" />
               <span className="font-semibold">Alert:</span>
             </div>
             <p className="text-muted-foreground">
               New wave of UPI refund scams detected in Maharashtra. <Link to="/auth" className="text-primary hover:underline font-medium">Check your messages now →</Link>
             </p>
           </div>
         </div>
       </section>
 
       {/* CTA Section */}
       <section className="py-20 md:py-32">
         <div className="container mx-auto px-4">
           <div className="max-w-3xl mx-auto text-center glass-card rounded-3xl p-12 border-primary/30">
             <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
               <Shield className="h-8 w-8 text-primary" />
             </div>
             <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Start Your Protection Today
            </h2>
             <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              Don't wait until you become a victim. Sign up now and get instant access to all our AI-powered protection tools.
            </p>
             <Button size="lg" asChild className="text-lg px-10 glow-primary">
              <Link to="/auth">
                Get Started for Free
                <ChevronRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

       <PublicFooter />
    </div>
  );
}
