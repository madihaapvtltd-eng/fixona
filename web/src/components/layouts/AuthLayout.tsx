import { Link, Outlet } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { AuthFooter } from '@/components/Footer';


export function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link to="/" className="flex items-center justify-center gap-2">
            <Logo className="h-12 w-12" />
            <span className="text-3xl font-bold text-gray-900">Fixora</span>
          </Link>
          <p className="mt-2 text-sm text-gray-600">
            Built for Zero Downtime
          </p>
        </div>
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Outlet />
        </div>
        <AuthFooter />
      </div>
    </div>
  );
}
