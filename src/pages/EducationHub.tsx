import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Input } from '@/components/ui/input';
import ScamTypeCard from '@/components/education/ScamTypeCard';
import ScamDetailView from '@/components/education/ScamDetailView';
import {
  GraduationCap,
  Search,
  MessageSquareWarning,
  Briefcase,
  CreditCard,
  Phone,
  Mail,
  UserCheck,
  Shield,
  ArrowRight,
  Lightbulb,
  BookOpen,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const SCAM_TYPES = [
  {
    id: 'otp-fraud',
    title: 'OTP Fraud',
    icon: Phone,
    color: 'text-danger',
    description: 'Scammers trick you into sharing your One-Time Password (OTP) to gain access to your bank accounts or digital wallets.',
    howItWorks: [
      'You receive a call claiming to be from your bank or payment service',
      'They create urgency by saying your account will be blocked',
      'They ask you to share the OTP "for verification"',
      'Once shared, they immediately transfer money from your account',
    ],
    redFlags: [
      'Unsolicited calls asking for OTP',
      'Pressure to act immediately',
      'Threatening account blockage',
      'Asking you to download apps like AnyDesk or TeamViewer',
    ],
    protection: [
      'NEVER share OTP with anyone, even if they claim to be from your bank',
      'Banks will never call and ask for OTP or PIN',
      'Hang up and call your bank directly using the number on your card',
      'Enable two-factor authentication on all accounts',
    ],
    realExample: '"Sir, this is Amit from SBI fraud department. Your account has been flagged for suspicious activity. To verify it\'s you, please share the OTP you just received..." This is ALWAYS a scam.',
  },
  {
    id: 'job-scam',
    title: 'Job Scam',
    icon: Briefcase,
    color: 'text-warning',
    description: 'Fake job offers that demand upfront payments for registration, training, or equipment before you can start "working".',
    howItWorks: [
      'Attractive job offer arrives via WhatsApp, email, or social media',
      'Unrealistically high salary for simple work (data entry, typing)',
      'Asked to pay for registration, training kit, or security deposit',
      'After payment, the "company" disappears or keeps asking for more',
    ],
    redFlags: [
      'Any job that asks for money upfront',
      'Salary seems too good to be true',
      'Interview conducted only via chat (no video/in-person)',
      'Vague job description and company details',
      'Personal email IDs instead of company domains',
    ],
    protection: [
      'Legitimate employers NEVER ask candidates to pay',
      'Research the company thoroughly before applying',
      'Verify job postings on official company websites',
      'Never share Aadhaar, PAN, or bank details before joining',
    ],
    realExample: '"Congratulations! You\'ve been selected for Amazon data entry work. Salary: ₹50,000/month. Pay ₹2,999 registration fee to start." Amazon never hires this way.',
  },
  {
    id: 'loan-scam',
    title: 'Loan Scam',
    icon: CreditCard,
    color: 'text-primary',
    description: 'Fake loan apps or agents promise instant loans but steal your data, charge hidden fees, or harass you for payments you never borrowed.',
    howItWorks: [
      'Download an app promising instant loans with minimal documentation',
      'App accesses your contacts, photos, and personal data',
      'Small loan approved, but with massive hidden charges',
      'When you can\'t pay, they harass you and your contacts',
    ],
    redFlags: [
      'Loan apps asking for permission to access contacts and gallery',
      'No physical office or verifiable RBI registration',
      'Processing fees deducted from loan amount',
      'Extremely short repayment periods (7-15 days)',
    ],
    protection: [
      'Only use RBI-registered NBFCs and banks for loans',
      'Check app reviews and ratings carefully',
      'Never grant unnecessary permissions to loan apps',
      'Report illegal loan apps to RBI and cybercrime portal',
    ],
    realExample: 'Apps like "EasyMoney" or "FastCash" approve ₹5,000 loans but take ₹2,000 as fees upfront, leaving you with ₹3,000 while owing ₹5,000 + interest.',
  },
  {
    id: 'phishing',
    title: 'Phishing',
    icon: Mail,
    color: 'text-success',
    description: 'Fake emails, SMS, or websites that look official but are designed to steal your login credentials and personal information.',
    howItWorks: [
      'Receive email/SMS that looks like it\'s from a trusted source',
      'Link leads to a fake website identical to the real one',
      'You enter your password or card details',
      'Scammers now have access to your accounts',
    ],
    redFlags: [
      'Suspicious sender email addresses (bankofindia@gmail.com)',
      'Urgent language: "Account suspended!" "Act now!"',
      'Links that don\'t match the official website',
      'Spelling and grammar mistakes',
    ],
    protection: [
      'Always type website URLs directly, never click email links',
      'Check for https:// and the padlock icon',
      'Hover over links to see the real URL before clicking',
      'When in doubt, contact the company directly',
    ],
    realExample: '"Your SBI account has been suspended. Click here to verify: http://sbi-secure-verify.tk" - The real SBI website is onlinesbi.sbi, never a random domain.',
  },
  {
    id: 'impersonation',
    title: 'Impersonation',
    icon: UserCheck,
    color: 'text-muted-foreground',
    description: 'Scammers pretend to be government officials, police, or authority figures to intimidate you into paying money.',
    howItWorks: [
      'Call claiming to be from CBI, IT Department, or Customs',
      'Accuse you of illegal activity (money laundering, unpaid taxes)',
      'Threaten immediate arrest unless you pay a "fine"',
      'Create panic to prevent you from thinking clearly',
    ],
    redFlags: [
      'Government agencies don\'t demand immediate payment over phone',
      'No real authority accepts payment via UPI or gift cards',
      'They refuse to give you time to verify their identity',
      'Threats of arrest if you don\'t comply immediately',
    ],
    protection: [
      'Real police/CBI won\'t call and threaten you for money',
      'Ask for their name and badge number, then verify independently',
      'No government fine is payable via UPI or cryptocurrency',
      'Take your time - legitimate authorities will wait',
    ],
    realExample: '"This is Inspector Sharma from Mumbai Cyber Cell. Your Aadhaar has been used for money laundering. Transfer ₹50,000 immediately or we will arrest you." This is 100% fake.',
  },
  {
    id: 'upi-fraud',
    title: 'UPI Refund Fraud',
    icon: Phone,
    color: 'text-warning',
    description: 'Scammers send fake UPI payment requests disguised as refunds, tricking victims into approving money transfers.',
    howItWorks: [
      'Scammer contacts you about a "refund" or "cashback"',
      'They send a UPI collect request instead of paying you',
      'The request looks like you\'re receiving money',
      'When you approve, money is debited from your account',
    ],
    redFlags: [
      'Anyone asking you to "accept" money via UPI — receiving money never requires approval',
      'Unsolicited calls about refunds you didn\'t request',
      'Pressure to approve quickly before the "offer expires"',
      'Requests from unknown UPI IDs',
    ],
    protection: [
      'You NEVER need to enter PIN or approve a request to receive money',
      'Ignore collect requests from unknown people',
      'Block and report suspicious UPI IDs',
      'Always verify refund claims directly with the company',
    ],
    realExample: '"Hi, I\'m from Paytm support. We\'re processing your ₹500 cashback. Please approve the request on your UPI app." You approve, and ₹500 is DEBITED, not credited.',
  },
];

const SAFETY_TIPS = [
  { icon: '🔐', tip: 'Never share OTP, PIN, or CVV with anyone — not even bank officials.' },
  { icon: '🔗', tip: 'Always verify URLs before clicking. Look for https:// and official domains.' },
  { icon: '📞', tip: 'If in doubt, hang up and call the official number from the company website.' },
  { icon: '💰', tip: 'No legitimate job or service requires upfront payment from you.' },
  { icon: '🛡️', tip: 'Report scams at cybercrime.gov.in or call 1930 (Cyber Crime Helpline).' },
  { icon: '📱', tip: 'Keep your apps updated and use official app stores only.' },
];

export default function EducationHub() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScam, setSelectedScam] = useState<typeof SCAM_TYPES[0] | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const filteredScams = SCAM_TYPES.filter(
    (scam) =>
      scam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scam.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 p-8" style={{ background: 'var(--gradient-hero)' }}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4 border border-primary/20">
              <GraduationCap className="h-4 w-4" />
              Education Hub
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">Scam Education Hub</h1>
            <p className="text-muted-foreground max-w-xl">
              Learn how scams work, recognize red flags, and protect yourself and your loved ones.
            </p>
          </div>
        </div>

        {/* Safety Tips Banner */}
        <div className="glass-card rounded-xl p-6 border-success/20">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-warning" />
            <h2 className="font-display font-semibold">Quick Safety Tips</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SAFETY_TIPS.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <span className="text-lg">{item.icon}</span>
                <p className="text-sm text-muted-foreground">{item.tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search scam types..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-secondary/50"
          />
        </div>

        {/* Section Title */}
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="font-display font-semibold text-lg">Scam Types Encyclopedia</h2>
          <span className="text-xs text-muted-foreground ml-auto">{filteredScams.length} types</span>
        </div>

        {/* Scam Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredScams.map((scam) => (
            <ScamTypeCard
              key={scam.id}
              scam={scam}
              isSelected={selectedScam?.id === scam.id}
              onClick={() => setSelectedScam(scam)}
            />
          ))}
        </div>

        {/* Detailed View */}
        {selectedScam && <ScamDetailView scam={selectedScam} />}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/scam-analyzer"
            className="glass-card rounded-xl p-6 hover:border-primary/30 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-danger/10">
                <MessageSquareWarning className="h-6 w-6 text-danger" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold group-hover:text-primary transition-colors">
                  Got a Suspicious Message?
                </h3>
                <p className="text-sm text-muted-foreground">Analyze it now</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Link>

          <Link
            to="/community-alerts"
            className="glass-card rounded-xl p-6 hover:border-primary/30 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-warning/10">
                <Shield className="h-6 w-6 text-warning" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold group-hover:text-primary transition-colors">
                  Community Alerts
                </h3>
                <p className="text-sm text-muted-foreground">See trending scam patterns</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
