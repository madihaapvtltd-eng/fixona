import { useEffect } from 'react';
import { useAuthStore, type Company } from '@/stores/authStore';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Building2, ChevronDown } from 'lucide-react';

export function CompanySelector() {
  const { user, companies, currentCompany, setCompanies, setCurrentCompany, isSuperAdmin } = useAuthStore();

  // Load companies on mount (for super admin)
  useEffect(() => {
    const loadCompanies = async () => {
      if (isSuperAdmin() && companies.length === 0) {
        const snap = await getDocs(collection(db, 'companies'));
        const comps = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Company[];
        setCompanies(comps.filter(c => c.isActive));
        // Set first company as current if none selected
        if (!currentCompany && comps.length > 0) {
          setCurrentCompany(comps[0]);
        }
      } else if (!isSuperAdmin() && user?.companyId) {
        // For regular users, load their company
        const snap = await getDocs(
          query(collection(db, 'companies'), where('__name__', '==', user.companyId))
        );
        if (!snap.empty) {
          const comp = { id: snap.docs[0].id, ...snap.docs[0].data() } as Company;
          setCurrentCompany(comp);
        }
      }
    };
    loadCompanies();
  }, [user?.companyId, isSuperAdmin, companies.length, setCompanies, setCurrentCompany, currentCompany]);

  // Only show selector for super admin with multiple companies
  if (!isSuperAdmin()) return null;
  if (companies.length <= 1) return null;

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 rounded-lg border border-primary-200">
        <Building2 size={16} className="text-primary-600" />
        <select
          value={currentCompany?.id || ''}
          onChange={(e) => {
            const company = companies.find(c => c.id === e.target.value);
            setCurrentCompany(company || null);
          }}
          className="bg-transparent text-sm font-medium text-primary-700 focus:outline-none cursor-pointer"
        >
          {companies.map(company => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
