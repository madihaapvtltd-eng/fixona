import { useAuthStore } from '@/stores/authStore';

export function useCompany() {
  const { user, currentCompany, isSuperAdmin } = useAuthStore();

  // Get the effective company ID
  // Super admins can select a company, regular users use their assigned company
  const companyId = isSuperAdmin() 
    ? currentCompany?.id 
    : user?.companyId;

  const companyName = isSuperAdmin()
    ? currentCompany?.name
    : user?.companyName;

  const hasCompanyAccess = !!companyId;

  return {
    companyId,
    companyName,
    hasCompanyAccess,
    isSuperAdmin: isSuperAdmin(),
    currentCompany,
    userCompanyId: user?.companyId,
  };
}
