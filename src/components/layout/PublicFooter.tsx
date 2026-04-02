 import { Link } from 'react-router-dom';
 import { Shield, Github, Twitter, Mail } from 'lucide-react';
 
 export default function PublicFooter() {
   return (
     <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm">
       <div className="container mx-auto px-4 py-12">
         <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
           {/* Brand */}
           <div className="md:col-span-2">
             <div className="flex items-center gap-2 mb-4">
               <div className="p-2 rounded-lg bg-primary/10">
                 <Shield className="h-5 w-5 text-primary" />
               </div>
               <span className="font-display font-bold text-lg">CivicShield</span>
             </div>
             <p className="text-muted-foreground text-sm max-w-xs">
               AI-powered protection for Indian citizens against digital scams, fraudulent job offers, and cyber threats.
             </p>
           </div>
 
           {/* Quick Links */}
           <div>
             <h4 className="font-semibold mb-4 text-sm">Quick Links</h4>
             <ul className="space-y-2 text-sm">
               <li>
                 <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                   Home
                 </Link>
               </li>
               <li>
                 <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">
                   About Us
                 </Link>
               </li>
               <li>
                 <Link to="/auth" className="text-muted-foreground hover:text-primary transition-colors">
                   Get Started
                 </Link>
               </li>
             </ul>
           </div>
 
           {/* Contact */}
           <div>
             <h4 className="font-semibold mb-4 text-sm">Contact</h4>
             <ul className="space-y-2 text-sm">
                <li className="text-muted-foreground">Alane Mohan</li>
               <li className="flex items-center gap-2 text-muted-foreground">
                 <Mail className="h-4 w-4" />
                  alanemohan@gmail.com
               </li>
             </ul>
             <div className="flex items-center gap-3 mt-4">
              <a href="#" aria-label="Twitter profile" title="Twitter" className="p-2 rounded-lg bg-secondary/50 hover:bg-primary/10 transition-colors">
                 <Twitter className="h-4 w-4 text-muted-foreground hover:text-primary" />
               </a>
              <a href="#" aria-label="GitHub profile" title="GitHub" className="p-2 rounded-lg bg-secondary/50 hover:bg-primary/10 transition-colors">
                 <Github className="h-4 w-4 text-muted-foreground hover:text-primary" />
               </a>
             </div>
           </div>
         </div>
 
         {/* Bottom Bar */}
         <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
           <p className="text-sm text-muted-foreground">
             © {new Date().getFullYear()} CivicShield. Protecting citizens digitally.
           </p>
           <div className="flex items-center gap-4 text-sm text-muted-foreground">
             <span className="flex items-center gap-1">
               <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
               All systems operational
             </span>
           </div>
         </div>
       </div>
     </footer>
   );
 }