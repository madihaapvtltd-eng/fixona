import { useState } from 'react';
import { useQuery } from 'react-query';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { exportWorkOrdersToCSV, exportInventoryToCSV, exportAssetsToCSV, exportMaintenanceLogsToCSV } from '@/lib/csvExport';
import { Download, FileText, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import Papa from 'papaparse';

export function ReportsPage() {
  const [reportType, setReportType] = useState('work_orders');

  const { data: reportData, isLoading } = useQuery(['report', reportType], async () => {
    let collectionRef = collection(db, reportType);
    const q = query(collectionRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  });

  const exportCSV = () => {
    if (!reportData) return;
    
    switch (reportType) {
      case 'work_orders':
        exportWorkOrdersToCSV(reportData);
        break;
      case 'assets':
        exportAssetsToCSV(reportData);
        break;
      case 'inventory':
        exportInventoryToCSV(reportData);
        break;
      case 'maintenance_logs':
        exportMaintenanceLogsToCSV(reportData);
        break;
      default:
        // Fallback to generic export
        const csv = Papa.unparse(reportData.map((item: any) => ({
          ...item,
          createdAt: item.createdAt?.toDate ? format(item.createdAt.toDate(), 'yyyy-MM-dd HH:mm') : '',
        })));
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner with Storyset Illustration */}
      <div className="card bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <img 
            src="/storyset-illustrations/Office management-amico.svg" 
            alt="Reports" 
            className="w-24 h-24 object-contain"
          />
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-sm text-gray-500">Export data and generate insights</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          className="input w-full sm:w-64"
        >
          <option value="work_orders">Work Orders</option>
          <option value="assets">Assets</option>
          <option value="inventory">Inventory</option>
          <option value="maintenance_logs">Maintenance Logs</option>
        </select>
        <button
          onClick={exportCSV}
          disabled={isLoading}
          className="btn-secondary inline-flex items-center"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </button>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold capitalize">{reportType.replace('_', ' ')} Report</h2>
        </div>
        
        {isLoading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <p className="text-gray-500">
            Total records: {reportData?.length || 0}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">This Month</p>
              <p className="text-2xl font-bold">{reportData?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
