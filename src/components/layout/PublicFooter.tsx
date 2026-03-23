export default function PublicFooter() {
  return (
    <footer className="border-t border-border/50 bg-background/80">
      <div className="container mx-auto px-4 py-6 text-sm text-muted-foreground text-center">
        © {new Date().getFullYear()} CivicShield. Stay safe online.
      </div>
    </footer>
  );
}
