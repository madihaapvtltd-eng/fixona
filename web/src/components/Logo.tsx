// Logo Component - Uses logo.png from public/logo/
// Place your logo.png file in the public/logo/ folder

export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <img 
      src="/logo/logo.png" 
      alt="Fixora Logo" 
      className={className}
      onError={(e) => {
        // Fallback if logo.png is not found
        e.currentTarget.style.display = 'none';
      }}
    />
  );
}

// Logo with text for header/branding
export function LogoWithText({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Logo className="h-8 w-8" />
      <div className="flex flex-col">
        <span className="font-bold text-xl text-primary-600 leading-none">Fixora</span>
        <span className="text-xs text-gray-500">Built for Zero Downtime</span>
      </div>
    </div>
  );
}
