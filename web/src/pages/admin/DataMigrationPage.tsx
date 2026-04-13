import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { collection, getDocs, updateDoc, doc, query, where, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { 
  Database, ArrowLeft, AlertTriangle, CheckCircle, 
  Building2, Users, Wrench, Package, FileText, Play
} from 'lucide-react';
import toast from 'react-hot-toast';

interface MigrationStats {
  collection: string;
  total: number;
  updated: number;
  icon: React.ReactNode;
}

const collectionsToMigrate = [
  { name: 'assets', label: 'Assets', icon: <Package size={20} /> },
  { name: 'users', label: 'Users', icon: <Users size={20} /> },
  { name: 'work_orders', label: 'Work Orders', icon: <Wrench size={20} /> },
  { name: 'projects', label: 'Projects', icon: <FileText size={20} /> },
  { name: 'inventory', label: 'Inventory', icon: <Package size={20} /> },
  { name: 'fuel_requests', label: 'Fuel Requests', icon: <Package size={20} /> },
];

export function DataMigrationPage() {
  const navigate = useNavigate();
  const { user, isSuperAdmin, companies } = useAuthStore();
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResults, setMigrationResults] = useState<MigrationStats[]>([]);

  // Get company with code MAD (Madihaa)
  const madihaaCompany = companies.find(c => c.code === 'MAD');

  const previewData = async () => {
    if (!selectedCompanyId) {
      toast.error('Please select a company');
      return;
    }

    const company = companies.find(c => c.id === selectedCompanyId);
    if (!company) return;

    const results: MigrationStats[] = [];

    for (const coll of collectionsToMigrate) {
      try {
        // Get documents without companyId
        const q = query(
          collection(db, coll.name),
          where('companyId', '==', null)
        );
        const snap = await getDocs(q);
        
        // Also get all docs to check which ones need migration
        const allSnap = await getDocs(collection(db, coll.name));
        const withoutCompany = allSnap.docs.filter(d => !d.data().companyId);

        results.push({
          collection: coll.label,
          total: withoutCompany.length,
          updated: 0,
          icon: coll.icon,
        });
      } catch (error) {
        console.error(`Error checking ${coll.name}:`, error);
        results.push({
          collection: coll.label,
          total: 0,
          updated: 0,
          icon: coll.icon,
        });
      }
    }

    setMigrationResults(results);
  };

  const runMigration = async () => {
    if (!selectedCompanyId) {
      toast.error('Please select a company');
      return;
    }

    const company = companies.find(c => c.id === selectedCompanyId);
    if (!company) return;

    setIsMigrating(true);
    const results: MigrationStats[] = [];

    for (const coll of collectionsToMigrate) {
      try {
        // Get all documents in collection
        const snap = await getDocs(collection(db, coll.name));
        const docsToUpdate = snap.docs.filter(d => !d.data().companyId);

        if (docsToUpdate.length === 0) {
          results.push({
            collection: coll.label,
            total: 0,
            updated: 0,
            icon: coll.icon,
          });
          continue;
        }

        // Update in batches of 500 (Firestore limit)
        const batchSize = 500;
        let updated = 0;

        for (let i = 0; i < docsToUpdate.length; i += batchSize) {
          const batch = writeBatch(db);
          const chunk = docsToUpdate.slice(i, i + batchSize);

          chunk.forEach(docSnapshot => {
            const ref = doc(db, coll.name, docSnapshot.id);
            batch.update(ref, {
              companyId: company.id,
              companyName: company.name,
              migratedAt: new Date().toISOString(),
            });
          });

          await batch.commit();
          updated += chunk.length;
        }

        results.push({
          collection: coll.label,
          total: docsToUpdate.length,
          updated,
          icon: coll.icon,
        });

        toast.success(`Migrated ${updated} ${coll.label}`);
      } catch (error) {
        console.error(`Error migrating ${coll.name}:`, error);
        toast.error(`Failed to migrate ${coll.label}`);
        results.push({
          collection: coll.label,
          total: 0,
          updated: 0,
          icon: coll.icon,
        });
      }
    }

    setMigrationResults(results);
    setIsMigrating(false);
    toast.success('Migration completed!');
  };

  if (!isSuperAdmin()) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="text-gray-500 mt-2">Only Super Admins can run data migration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/companies')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Database className="text-primary-600" />
            Data Migration Tool
          </h1>
          <p className="text-gray-500">Assign existing data to a company</p>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-yellow-600 flex-shrink-0" size={24} />
          <div>
            <h3 className="font-medium text-yellow-800">Important</h3>
            <p className="text-sm text-yellow-700 mt-1">
              This tool will assign all existing data (without a company) to the selected company. 
              This action cannot be undone. Make sure you select the correct company.
            </p>
          </div>
        </div>
      </div>

      {/* Company Selection */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Building2 size={20} />
          Select Target Company
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="label">Company *</label>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="input"
            >
              <option value="">Select a company...</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {madihaaCompany && !selectedCompanyId && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Recommended:</strong> Madihaa PVT LTD (MAD) has existing data. 
                Select this company to assign all existing assets, users, and work orders to it.
              </p>
              <button
                onClick={() => setSelectedCompanyId(madihaaCompany.id)}
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                Select Madihaa PVT LTD
              </button>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={previewData}
              disabled={!selectedCompanyId}
              className="btn btn-secondary"
            >
              Preview Data
            </button>
            <button
              onClick={runMigration}
              disabled={!selectedCompanyId || isMigrating}
              className="btn btn-primary flex items-center gap-2"
            >
              {isMigrating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Migrating...
                </>
              ) : (
                <>
                  <Play size={18} />
                  Run Migration
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Migration Results */}
      {migrationResults.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Migration Results</h2>
          <div className="space-y-3">
            {migrationResults.map((result) => (
              <div 
                key={result.collection}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
                    {result.icon}
                  </div>
                  <div>
                    <div className="font-medium">{result.collection}</div>
                    <div className="text-sm text-gray-500">
                      {result.total} documents found
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {result.updated > 0 ? (
                    <>
                      <CheckCircle size={20} className="text-green-500" />
                      <span className="text-green-600 font-medium">
                        {result.updated} updated
                      </span>
                    </>
                  ) : result.total > 0 ? (
                    <span className="text-gray-500">Pending</span>
                  ) : (
                    <span className="text-gray-500">No action needed</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="card bg-gray-50">
        <h3 className="font-medium text-gray-900 mb-2">How it works:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
          <li>Select the company that should own the existing data (e.g., Madihaa PVT LTD)</li>
          <li>Click "Preview Data" to see how many documents will be affected</li>
          <li>Click "Run Migration" to assign companyId to all documents</li>
          <li>After migration, only users from that company will see that data</li>
          <li>New data will automatically be tagged with the user's company</li>
        </ol>
      </div>
    </div>
  );
}
