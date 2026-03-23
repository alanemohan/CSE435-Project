import { ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Shield, LayoutDashboard, MessageSquareWarning, FileText, BookOpen, Bell, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navLinks = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Scam Analyzer', path: '/scam-analyzer', icon: MessageSquareWarning },
  { label: 'Complaint Generator', path: '/complaint-generator', icon: FileText },
  { label: 'Education Hub', path: '/education-hub', icon: BookOpen },
  { label: 'Community Alerts', path: '/community-alerts', icon: Bell },
  { label: 'Profile', path: '/profile', icon: User },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/90 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-display font-semibold">CivicShield</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={signOut}>Sign out</Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4">
        <nav className="mb-6 flex flex-wrap gap-2">
          {navLinks.map((link) => (
            <Button
              key={link.path}
              asChild
              variant={location.pathname === link.path ? 'default' : 'outline'}
              size="sm"
            >
              <Link to={link.path} className={cn('inline-flex items-center gap-2')}>
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            </Button>
          ))}
        </nav>
        <main>{children}</main>
      </div>
    </div>
  );
}
