import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, ArrowRight, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import ThemeToggle from '@/components/ThemeToggle';
 
 const navLinks = [
   { label: 'Home', path: '/' },
   { label: 'About', path: '/about' },
 ];
 
 export default function PublicNavbar() {
   const { user } = useAuth();
   const location = useLocation();
   const [mobileOpen, setMobileOpen] = useState(false);
 
   return (
     <nav className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
       <div className="container mx-auto px-4 py-4 flex items-center justify-between">
         {/* Logo */}
         <Link to="/" className="flex items-center gap-2 group">
           <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
             <Shield className="h-6 w-6 text-primary" />
           </div>
           <span className="text-xl font-display font-bold gradient-text">CivicShield</span>
         </Link>
 
         {/* Desktop Navigation */}
         <div className="hidden md:flex items-center gap-1">
           {navLinks.map((link) => (
             <Link
               key={link.path}
               to={link.path}
               className={cn(
                 'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                 location.pathname === link.path
                   ? 'bg-primary/10 text-primary'
                   : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
               )}
             >
               {link.label}
             </Link>
           ))}
         </div>
 
      {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
           {user ? (
             <Button asChild className="glow-primary">
               <Link to="/dashboard">
                 Go to Dashboard
                 <ArrowRight className="h-4 w-4 ml-2" />
               </Link>
             </Button>
           ) : (
             <>
               <Button variant="ghost" asChild>
                 <Link to="/auth">Sign In</Link>
               </Button>
               <Button asChild className="glow-primary">
                 <Link to="/auth">
                   Get Started
                   <ArrowRight className="h-4 w-4 ml-2" />
                 </Link>
               </Button>
             </>
           )}
         </div>
 
         {/* Mobile Menu Button */}
         <Button
           variant="ghost"
           size="icon"
           className="md:hidden"
           onClick={() => setMobileOpen(!mobileOpen)}
         >
           {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
         </Button>
       </div>
 
       {/* Mobile Menu */}
       {mobileOpen && (
         <div className="md:hidden border-t border-border/50 bg-card/95 backdrop-blur-xl animate-fade-in">
           <div className="container mx-auto px-4 py-4 space-y-2">
             {navLinks.map((link) => (
               <Link
                 key={link.path}
                 to={link.path}
                 onClick={() => setMobileOpen(false)}
                 className={cn(
                   'block px-4 py-3 rounded-lg font-medium transition-all',
                   location.pathname === link.path
                     ? 'bg-primary/10 text-primary'
                     : 'text-muted-foreground hover:bg-secondary/50'
                 )}
               >
                 {link.label}
               </Link>
             ))}
             <div className="pt-2 border-t border-border/50 space-y-2">
               {user ? (
                 <Button asChild className="w-full">
                   <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                     Go to Dashboard
                     <ArrowRight className="h-4 w-4 ml-2" />
                   </Link>
                 </Button>
               ) : (
                 <>
                   <Button variant="outline" asChild className="w-full">
                     <Link to="/auth" onClick={() => setMobileOpen(false)}>Sign In</Link>
                   </Button>
                   <Button asChild className="w-full">
                     <Link to="/auth" onClick={() => setMobileOpen(false)}>Get Started</Link>
                   </Button>
                 </>
               )}
             </div>
           </div>
         </div>
       )}
     </nav>
   );
 }