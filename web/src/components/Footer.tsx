import { Code, Building2, Heart } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-gray-200 py-4 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left - Copyright */}
          <div className="text-sm text-gray-500">
            © {currentYear} Fixora. All rights reserved.
          </div>
          
          {/* Center - Developer Credit */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-gray-600">
              <Code className="h-4 w-4 text-primary-600" />
              <span>Developed by <span className="font-semibold text-primary-600">RettsWebDev</span></span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-gray-300"></div>
            <div className="flex items-center gap-1.5 text-gray-600">
              <Building2 className="h-4 w-4 text-primary-600" />
              <span>Powered by <span className="font-semibold text-primary-600">Madihaa Company PVT LTD</span></span>
            </div>
          </div>
          
          {/* Right - Made with love */}
          <div className="hidden lg:flex items-center gap-1 text-xs text-gray-400">
            Made with <Heart className="h-3 w-3 text-red-500 fill-red-500" /> in Maldives
          </div>
        </div>
      </div>
    </footer>
  );
}

// Simplified version for auth pages
export function AuthFooter() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="mt-8 py-4">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
          <span>© {currentYear} Fixora</span>
          <span className="w-px h-3 bg-gray-300"></span>
          <span>Developed by <span className="font-medium text-primary-600">RettsWebDev</span></span>
        </div>
        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <Building2 className="h-3 w-3" />
          <span>Powered by <span className="font-medium text-gray-500">Madihaa Company PVT LTD</span></span>
        </div>
      </div>
    </footer>
  );
}
